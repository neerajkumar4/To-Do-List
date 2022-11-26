const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const lodash = require("lodash");
const app = express();
mongoose.connect("mongodb://localhost:27017/todolistDB")
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static("public"));

const itemSchema = new mongoose.Schema({
    name: String
})
const listSchema = new mongoose.Schema({
    name: String,
    items: [itemSchema]
})
const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("list", listSchema);
const item1 = new Item({
    name: "Welcome to your Todo list!"
});
const item2 = new Item({
    name: "Hit the + button to add new item"
});
const item3 = new Item({
    name: "<-- Hit this to delete item"
})
const defaultItems = [item1, item2, item3];

app.get("/", (req, res) => {
    Item.find({}, (err, foundItems) => {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("suucessfully saved default items to DB");
                }
            })
            res.redirect("/")
        } else {
            res.render("list", { listTitle: "Today", newListItems: foundItems })
        }

    })
})

app.get('/:customListName', (req, res) => {
    const customListName = lodash.capitalize(req.params.customListName);
    List.findOne({ name: customListName }, (err, foundList) => {
        if (!err) {
            if (!foundList) {
                //creating new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                //show an existing list
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items })
            }
        }
    })


})

app.post("/", (req, res) => {
    const itemName = req.body.newitem;
    const listName = req.body.list;
    const item = new Item({
        name: itemName
    });
    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName }, (err, foundList) => {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        })
    }


})

app.post("/delete", (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === "Today") {
        Item.findByIdAndDelete(checkedItemId, (err) => {
            if (!err) {
                console.log("successfully deleted checked item!");
            }
        })
        res.redirect("/");
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, (err, foundlist) => {
            if (!err) {
                res.redirect("/" + listName);
            }
        })
    }

})



app.get("/about", (req, res) => {
    res.render('about');
})
app.listen(3000, () => {
    console.log("server running at port 3000");
})