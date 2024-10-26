const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const player = require("play-sound")(); // Import the play-sound package
const app = express();
const PORT = 3001;

// Middleware to parse JSON bodies
app.use(express.json());

// Set up multer storage for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, "uploads");
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// File upload endpoint
app.post("/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).send("No file uploaded.");
    }
    res.send({ message: "File uploaded successfully", filename: req.file.filename });
});

// Endpoint to get audio files
app.get("/get-audio-files", (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            return res.status(500).send("Error reading audio directory.");
        }
        const audioFiles = files.filter(file => file.endsWith('.wav') || file.endsWith('.mp3'));
        res.json(audioFiles);
    });
});

// Endpoint to delete audio files
app.delete("/delete-audio-file", (req, res) => {
    const { file } = req.body;
    const filePath = path.join(uploadDir, file);
    
    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(500).send("Error deleting file.");
        }
        res.send({ message: `File deleted: ${file}` });
    });
});


const playAudioFiles = () => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            console.error("Error reading audio directory:", err);
            return;
        }

        // Filter for audio files
        const audioFiles = files.filter(file => file.endsWith('.wav') || file.endsWith('.mp3'));

        // Play each audio file
        audioFiles.forEach(file => {
            const filePath = path.join(uploadDir, file);

            player.play(filePath, (err) => {
                if (err) {
                    console.error("Error playing audio:", err);
                    return;
                }

                // Listen for the end of the audio playback
                // player.endsWith('end', () => {
                //     // Delete the file after playback
                //     fs.unlink(filePath, (deleteErr) => {
                //         if (deleteErr) {
                //             console.error("Error deleting file:", deleteErr);
                //             return;
                //         }
                //         console.log(`File deleted after playback: ${file}`);
                //     });
                // });
            });
        });
    });
};


// Endpoint to get .txt files and their content
app.get("/get-text-files", (req, res) => {
    const textDir = path.join(__dirname, "text-files"); // Adjust the folder path as needed

    fs.readdir(textDir, (err, files) => {
        if (err) {
            return res.status(500).send("Error reading text directory.");
        }

        const textFiles = files.filter(file => file.endsWith('.txt'));
        const fileContents = {};

        // Read each .txt file's content
        const readFiles = textFiles.map(file => {
            return new Promise((resolve, reject) => {
                fs.readFile(path.join(textDir, file), 'utf8', (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        fileContents[file] = data;
                        resolve();
                    }
                });
            });
        });

        Promise.all(readFiles)
            .then(() => {
                res.json(fileContents);
            })
            .catch(err => {
                res.status(500).send("Error reading text files.");
            });
    });
});

// Check for new audio files every few seconds
playAudioFiles // Check every 5 seconds

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
