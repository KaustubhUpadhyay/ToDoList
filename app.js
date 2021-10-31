const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const _ = require("lodash");
const mongoose = require("mongoose");

const date = require(__dirname + "/date.js");

const app = express();

app.set("view engine", "ejs");
let items = [];
let workItems = [];

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
});

const itemSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Build Your list",
});


const defItems = [item1];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({}, function (err, items) {
    if (items.length == 0) {
      Item.insertMany(defItems, function (err) {
        if (err) {
          console.log("Error");
        } else {
          console.log("Done");
        }
      });
    }
    res.render("list", {
      x: "Today",
      newListItems: items,
    });
  });
});

app.get("/:customName", function (req, res) {
  const customName = _.capitalize(req.params.customName);

  List.findOne({ name: customName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customName,
          items: defItems,
        });

        list.save();
        res.redirect("/" + customName);
      } else {
        res.render("list", {
          x: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });

  const list = new List({
    name: customName,
    items: defItems,
  });

  list.save();
});

app.post("/", function (req, res) {
  let item = req.body.newItem;
  let listName = req.body.list;

  const item4 = new Item({
    name: item,
  });

  if (listName == "Today") {
    item4.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item4);
      foundList.save();

      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkBox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndDelete(checkedItemId, function (err) {
      if (err) {
        console.log("Error in delete");
      } else {
        console.log("Done Delete");
      }
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.listen(3000, function () {
  console.log("Server is running");
});
