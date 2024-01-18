// Global Variables
const correctPassword = "password"; // Set your password here
let hasEnteredPassword = localStorage.getItem("hasEnteredPassword");
let mediaRecorder;
let audioStream;
let audioChunks = [];
let cursorPosition = 0;

// DOM Elements
const textArea = document.getElementById("transcriptArea");
const recordButton = document.getElementById('recordButton');
const addMore = document.getElementById('addTranscript');

const recordButton2 = document.getElementById('MrecordButton');
const textArea2 = document.getElementById("MtranscriptArea");

// Password Check and Microphone Request
if (!hasEnteredPassword) {
    let password = prompt("Please enter the password:");
    if (password === correctPassword) {
        localStorage.setItem("hasEnteredPassword", "true");
        requestMicrophonePermission();
    } else {
        alert("Incorrect password. Access denied.");
        window.location.href = 'about:blank';
    }
} else {
    requestMicrophonePermission();
}

// Microphone Permission Request
function requestMicrophonePermission() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                console.log("Microphone access granted");
                audioStream = stream; // Store the stream globally
            })
            .catch(err => {
                console.error("Microphone access denied: ", err);
                alert("Microphone access is needed for recording.");
            });
    } else {
        console.error("Browser does not support getUserMedia");
        alert("Your browser does not support the required features for recording.");
    }
}

// Function to Close Microphone Connection
function closeMicrophoneConnection() {
    if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        audioStream = null; // Reset the audioStream to null
    }
}

// TextArea and Button Event Listeners
textArea.addEventListener('click', () => {
    cursorPosition = textArea.selectionStart;
});

textArea.addEventListener('focus', () => {
    addMore.disabled = false;
});

textArea.addEventListener('blur', () => {
    addMore.disabled = true;
});

addMore.disabled = true; // Initially disabled

document.getElementById("clearButton").addEventListener("click", function() {
    textArea.value = '';
});

document.getElementById("MclearButton").addEventListener("click", function() {
    textArea2.value = '';
});

// Record Button Event Listeners
recordButton.addEventListener('mousedown', handleButtonPress);
recordButton.addEventListener('mouseup', handleButtonRelease);
recordButton.addEventListener('touchstart', handleButtonPress, {passive: true});
recordButton.addEventListener('touchend', handleButtonRelease);

// Add More Button Event Listeners
addMore.addEventListener('mousedown', handleButtonPress);
addMore.addEventListener('mouseup', handleButtonRelease);
addMore.addEventListener('touchstart', handleButtonPress, {passive: true});
addMore.addEventListener('touchend', handleButtonRelease);

recordButton2.addEventListener('mousedown', handleButtonPress);
recordButton2.addEventListener('mouseup', handleButtonRelease);
recordButton2.addEventListener('touchstart', handleButtonPress, {passive: true});
recordButton2.addEventListener('touchend', handleButtonRelease);


// Record and Add More Buttons Handler Functions
async function handleButtonPress(event) {
    event.preventDefault();
    if (mediaRecorder && mediaRecorder.state !== 'inactive') return;

    try {
        if (!audioStream) audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        mediaRecorder = new MediaRecorder(audioStream);
        mediaRecorder.start();

        this.style.backgroundColor = "#ff4040"; // Change color to red when recording

        audioChunks = [];
        mediaRecorder.addEventListener("dataavailable", event => {
            audioChunks.push(event.data);
        });
    } catch (error) {
        console.error('Error accessing media devices:', error);
        alert("Microphone access was denied or an error occurred.");
    }
}

async function handleButtonRelease() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
            sendAudioToServer(audioBlob, this);

            this.style.backgroundColor = "#ff0000"; // Change color back to red when not recording
            closeMicrophoneConnection(); // Close the microphone connection
        };
    }
}

// Function to Send Audio to Server
function sendAudioToServer(audioBlob, button) {
    const formData = new FormData();
    formData.append("audioFile", audioBlob, "recording.mp3");

    fetch('/upload', {
        method: 'POST',
        body: formData
    }).then(response => response.json()).then(data => {
        console.log(data);
        if (data.transcript) {
            if (button === addMore) {
                insertAtCursor(data.transcript);
            } else {
                if (button === recordButton2) {
                    textArea2.value += data.transcript;
                } else {
                    textArea.value += data.transcript;
                }
            }
            
            formatText();
        }
    }).catch(error => {
        console.error('Error sending audio to server:', error);
    });
}

// Function to Insert Text at Cursor Position
function insertAtCursor(text) {
    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;

    // Check if any text is selected
    if (start !== end) {
        // Replace the selected text
        const beforeText = textArea.value.substring(0, start);
        const afterText = textArea.value.substring(end);
        textArea.value = beforeText + text + afterText;

        // Update cursor position to the end of the inserted text
        cursorPosition = start + text.length;
    } else {
        // No text is selected, insert at cursor position
        const beforeText = textArea.value.substring(0, cursorPosition);
        const afterText = textArea.value.substring(cursorPosition);
        textArea.value = beforeText + text + afterText;

        // Update cursor position to the end of the inserted text
        cursorPosition += text.length;
    }

    // Set focus and move cursor to the end of the inserted text
    textArea.focus();
    textArea.setSelectionRange(cursorPosition, cursorPosition);
    formatText();
}

// Function to Format Text
function formatText() {
    let textArea = document.getElementById("transcriptArea");
    let text1 = textArea.value;

    let formattedText = text1.replace(/\. /g, ".\n\n");
    textArea.value = formattedText;
    let text = textArea.value;
    let lines = text.split("\n");
    let processedLines = [];

    for (let line of lines) {
        while (line.length > 50) {
            let spaceIndex = line.lastIndexOf(' ', 50);

            if (spaceIndex > -1) {
                // Break line at the space index
                processedLines.push(line.substring(0, spaceIndex));
                line = line.substring(spaceIndex + 1);
            } else {
                // If no space found within 50 characters, take the whole line
                break;
            }
        }
        processedLines.push(line);
    }

    textArea.value = processedLines.join("\n");
}

// Copy and Format Button Event Listeners
document.getElementById("copyButton").addEventListener("click", function() {
    navigator.clipboard.writeText(textArea.value)
        .then(() => {
            showSpeechBubble();
        })
        .catch(err => {
            console.error('Error in copying text: ', err);
        });
});

document.getElementById("McopyButton").addEventListener("click", function() {
    navigator.clipboard.writeText(textArea2.value)
        .then(() => {
            MshowSpeechBubble();
        })
        .catch(err => {
            console.error('Error in copying text: ', err);
        });
});

document.getElementById("formatText").addEventListener("click", formatText);
document.getElementById("MformatText").addEventListener("click", MformatText);
// Speech Bubble Display Function

function MformatText() {
    let textArea2 = document.getElementById("MtranscriptArea");
    let text1 = textArea2.value;

    let formattedText = text1.replace(/\. /g, ".\n\n");
    textArea2.value = formattedText;
    let text = textArea2.value;
    let lines = text.split("\n");
    let processedLines = [];

    for (let line of lines) {
        while (line.length > 50) {
            let spaceIndex = line.lastIndexOf(' ', 50);

            if (spaceIndex > -1) {
                // Break line at the space index
                processedLines.push(line.substring(0, spaceIndex));
                line = line.substring(spaceIndex + 1);
            } else {
                // If no space found within 50 characters, take the whole line
                break;
            }
        }
        processedLines.push(line);
    }

    textArea2.value = processedLines.join("\n");
}

function showSpeechBubble() {
    let speechBubble = document.getElementById("speechBubble");
    speechBubble.style.display = "block";

    let textArea = document.getElementById("transcriptArea");
    speechBubble.style.left = textArea.offsetLeft + textArea.offsetWidth / 2 - speechBubble.offsetWidth / 2 + 'px';
    speechBubble.style.top = textArea.offsetTop + textArea.offsetHeight / 2 - speechBubble.offsetHeight / 2 + 'px';

    setTimeout(() => {
        speechBubble.style.display = "none";
    }, 3000);
}
function MshowSpeechBubble() {
    let speechBubble = document.getElementById("MspeechBubble");
    speechBubble.style.display = "block";

    let textArea2 = document.getElementById("MtranscriptArea");
    speechBubble.style.left = textArea2.offsetLeft + textArea2.offsetWidth / 2 - speechBubble2.offsetWidth / 2 + 'px';
    speechBubble.style.top = textArea2.offsetTop + textArea2.offsetHeight / 2 - speechBubble2.offsetHeight / 2 + 'px';

    setTimeout(() => {
        speechBubble.style.display = "none";
    }, 3000);
}
// ... Continue with any other logic or functions

