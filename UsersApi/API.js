const express = require("express");
const app = express();
const { Generatetoken, Authenticator } = require("./TheMiddleware");
const { User, Note } = require("../Database/schema.js");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcrypt = require("bcryptjs");
require('dotenv').config();
app.use(cors());
app.use(express.json());
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure storage for image and audio files separately

/// Use multer with memory storage to capture files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// -----------------------------
// CREATE NOTE (POST /notes/add)




// Use upload.fields to handle multiple file fields:
app.post(
  "/notes/add",
  Authenticator,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      if (!req.body.title || !req.body.text) {
        return res.status(400).json({ message: "Title and text are required" });
      }

      const note = new Note({
        title: req.body.title,
        text: req.body.text,
        transcription: req.body.transcription || "",
        image: req.files?.image ? req.files.image[0].buffer : null,
        audio: req.files?.audio ? req.files.audio[0].buffer : null,
        user: req.data.email,
      });

      await note.save();
      res.json({ message: "Note added", note });
    } catch (e) {
      console.error("Error creating note:", e);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// -----------------------------
// UPDATE NOTE (PUT /notes/:id)
// -----------------------------
app.put(
  "/notes/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const note = await Note.findById(req.params.id);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }

      // Only update fields that are provided
      const updateFields = {
        title: req.body.title || note.title,
        text: req.body.text || note.text,
        transcription: req.body.transcription || note.transcription,
      };

      // ✅ Handle Image Upload (Convert Buffer)
      if (req.files?.image) {
        updateFields.image = req.files.image[0].buffer;
      }

      // ✅ Handle Audio Upload (Convert Buffer)
      if (req.files?.audio) {
        updateFields.audio = req.files.audio[0].buffer;
      }

      const updatedNote = await Note.findByIdAndUpdate(req.params.id, updateFields, { new: true });

      res.json({ message: "Note updated", note: updatedNote });
    } catch (e) {
      console.error("Error updating note:", e);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);


// -----------------------------
// GET NOTES (GET /notes)
// -----------------------------
app.get("/notes", Authenticator, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.data.email });

    const formattedNotes = notes.map((note) => {
      const noteObj = note.toObject();

      // Convert Image to Base64
      if (noteObj.image) {
        noteObj.image = `data:image/jpeg;base64,${noteObj.image.toString("base64")}`;
      }

      // ✅ Convert Audio to Base64 and set the correct Content-Type
      if (noteObj.audio) {
        noteObj.audio = `data:audio/wav;base64,${noteObj.audio.toString("base64")}`;
      }

      return noteObj;
    });

    res.json(formattedNotes);
  } catch (e) {
    console.error("Error fetching notes:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/signup", async function (req, res) {
  if (req.body.email && req.body.password) {
    const existingUser = await User.findOne({ email: req.body.email });
    if (!existingUser) {
      const user = new User({
        email: req.body.email,
        password: await bcrypt.hash(req.body.password, 13),
        profile: req.body.name
      });
      await user.save();
      res.json({ message: "user created" });
    } else {
      res.json({ message: "Use another email" });
    }
  }
});

app.post("/login", async function (req, res) {
  if (req.body.email) {
    const datass = await User.findOne({ email: req.body.email });
    if (datass) {
      if (await bcrypt.compare(req.body.password, datass.password)) {
        const tkn = Generatetoken(req.body.email);
        res.json({ message: "login success", token: tkn, name: datass.profile});
      } else {
        res.json({ message: "login failed not correct email or password" });
      }
    } else {
      res.json({ message: "user not found" });
    }
  }
});



app.post("/notes/favourite/:id", Authenticator, async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { favourite: true },
      { new: true }
    );
    res.json({ message: "Note marked as favourite", note });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/notes/unfavourite/:id", Authenticator, async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { favourite: false },
      { new: true }
    );
    res.json({ message: "Note removed from favourites", note });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/notes/favourites/:user", Authenticator, async (req, res) => {
  try {
    const favNotes = await Note.find({
      user: req.params.user,
      favourite: true,
    });
    res.json(favNotes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


app.delete("/notes/:id", async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    res.json({ message: "Note deleted", note });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(3000, function () {
  console.log("server is running");
});