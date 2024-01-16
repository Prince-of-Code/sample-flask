const correctPassword = "password"; // Set your password here
let hasEnteredPassword = localStorage.getItem("hasEnteredPassword");

if (!hasEnteredPassword) {
    let password = prompt("Please enter the password:");

    if (password === correctPassword) {
        localStorage.setItem("hasEnteredPassword", "true");
        // Correct password entered, request microphone access
        requestMicrophonePermission();
    } else {
        alert("Incorrect password. Access denied.");
        window.location.href = 'about:blank'; // Redirect to a blank page
    }
} else {
    // User already entered password correctly before, request microphone access
    requestMicrophonePermission();
}

function requestMicrophonePermission() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                console.log("Microphone access granted");
                // Microphone access granted
                // You can now use the stream
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

let cursorPosition = 0;
const textArea = document.getElementById("transcriptArea");

textArea.addEventListener('click', () => {
    cursorPosition = textArea.selectionStart;
});

document.getElementById("clearButton").addEventListener("click", function() {
    document.getElementById("transcriptArea").value = '';
});

let mediaRecorder;
let audioChunks = [];
let audioStream;
let currentAudio = null;

function openNav() {
  document.getElementById("mySidepanel").style.width = "250px";
}

function closeNav() {
  document.getElementById("mySidepanel").style.width = "0";
}



const addMore = document.getElementById('addTranscript');

addMore.addEventListener('mousedown', handleButtonPress2);
addMore.addEventListener('mouseup', handleButtonRelease2);
addMore.addEventListener('touchstart', handleButtonPress2, {passive: true});
addMore.addEventListener('touchend', handleButtonRelease2);

textArea.addEventListener('focus', () => {
    addMore.disabled = false;
});

textArea.addEventListener('blur', () => {
    addMore.disabled = true;
});

// Initially disabled
addMore.disabled = true;

async function handleButtonPress2(event) {
    event.preventDefault(); // Prevent additional mouse event on touch devices

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        return;
    }

    try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        mediaRecorder = new MediaRecorder(audioStream);
        mediaRecorder.start();

        addMore.style.backgroundColor = "#ff4040"; // Change color to red when recording

        audioChunks = [];
        mediaRecorder.addEventListener("dataavailable", event => {
            audioChunks.push(event.data);
        });
    } catch (error) {
        console.error('Error accessing media devices:', error);
        // Handle the error or permission denial here
        alert("Microphone access was denied or an error occurred.");
    }
}

async function handleButtonRelease2() {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();

                // Close the microphone stream
                audioStream.getTracks().forEach(track => track.stop());

                // Properly handle the stop event
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
                    sendAudioToServer2(audioBlob);

                    addMore.style.backgroundColor = "#ff0000"; // Change color back to red when not recording
                };
            }
        }

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
        // Modification to sendAudioToServer function
        function sendAudioToServer2(audioBlob) {
            const formData = new FormData();
            formData.append("audioFile", audioBlob, "recording.mp3");

            fetch('/upload', {
                method: 'POST',
                body: formData
            }).then(response => response.json()).then(data => {
                console.log(data);
                if (data.transcript) {
                    insertAtCursor(data.transcript);
                }
            }).catch(error => {
                console.error('Error sending audio to server:', error);
            });
        }

const recordButton = document.getElementById('recordButton');

recordButton.addEventListener('mousedown', handleButtonPress);
recordButton.addEventListener('mouseup', handleButtonRelease);
recordButton.addEventListener('touchstart', handleButtonPress, {passive: true});
recordButton.addEventListener('touchend', handleButtonRelease);

async function handleButtonPress(event) {
    event.preventDefault(); // Prevent additional mouse event on touch devices

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        return;
    }

    try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        mediaRecorder = new MediaRecorder(audioStream);
        mediaRecorder.start();

        recordButton.style.backgroundColor = "#ff4040"; // Change color to red when recording

        audioChunks = [];
        mediaRecorder.addEventListener("dataavailable", event => {
            audioChunks.push(event.data);
        });
    } catch (error) {
        console.error('Error accessing media devices:', error);
        // Handle the error or permission denial here
        alert("Microphone access was denied or an error occurred.");
    }
}

async function handleButtonRelease() {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();

                // Close the microphone stream
                audioStream.getTracks().forEach(track => track.stop());

                // Properly handle the stop event
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
                    sendAudioToServer(audioBlob);

                    recordButton.style.backgroundColor = "#ff0000"; // Change color back to red when not recording
                };
            }
        }

        // Modification to sendAudioToServer function
        function sendAudioToServer(audioBlob) {
            const formData = new FormData();
            formData.append("audioFile", audioBlob, "recording.mp3");

            fetch('/upload', {
                method: 'POST',
                body: formData
            }).then(response => response.json()).then(data => {
                console.log(data);
                if (data.transcript) {
                    document.getElementById("transcriptArea").value += data.transcript;
                    formatText();
                }
            }).catch(error => {
                console.error('Error sending audio to server:', error);
            });
        }
        
        function formatText() {
    let textArea = document.getElementById("transcriptArea");
    let text = textArea.value;
    // Regular expression to match various newline phrases
    // text = text.replace(/New\s?line[.,]|Newline[.,]|newline[.,]/gi, "\n");
    // Replace period followed by a space with period and newline
    let formattedText = text.replace(/\. /g, ".\n\n");
    textArea.value = formattedText;
}

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
        // JavaScript for Copy Button
        document.getElementById("copyButton").addEventListener("click", function() {
    let transcript = document.getElementById("transcriptArea").value;
    navigator.clipboard.writeText(transcript)
        .then(() => {
            // Show speech bubble here
            showSpeechBubble();
        })
        .catch(err => {
            console.error('Error in copying text: ', err);
        });
});

document.getElementById("formatText").addEventListener("click", function() {
    formatText();
});

function showSpeechBubble() {
    let speechBubble = document.getElementById("speechBubble");
    speechBubble.style.display = "block";

    // Positioning the speech bubble in the middle of the textarea
    let textArea = document.getElementById("transcriptArea");
    speechBubble.style.left = textArea.offsetLeft + textArea.offsetWidth / 2 - speechBubble.offsetWidth / 2 + 'px';
    speechBubble.style.top = textArea.offsetTop + textArea.offsetHeight / 2 - speechBubble.offsetHeight / 2 + 'px';

    // Hide the speech bubble after a few seconds
    setTimeout(() => {
        speechBubble.style.display = "none";
    }, 3000); // Adjust time as needed
}