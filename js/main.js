function modifyJsonData(data) {
    function modifyRecursive(obj) {
        if (typeof obj === 'object' && obj !== null) {
            if (Array.isArray(obj)) {
                for (let item of obj) {
                    modifyRecursive(item);
                }
            } else {
                for (let key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        if (typeof obj[key] === 'object' && obj[key] !== null) {
                            modifyRecursive(obj[key]);
                        } else {
                            if (key === "fillJournal") {
                                obj[key] = true;
                            } else if (key.startsWith('journal') && key !== "fillJournal") {
                                obj[key] = 168;
                            } else if (key.startsWith('killed') && !key.startsWith('kills')) {
                                obj[key] = true;
                            } else if (key.startsWith('kills')) {
                                obj[key] = 0;
                            } else if (key.startsWith('new')) {
                                obj[key] = false;
                            }
                        }
                    }
                }
            }
        }
    }
    
    const dataCopy = JSON.parse(JSON.stringify(data));
    modifyRecursive(dataCopy);
    return dataCopy;
}

async function processSaveFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const arrayBuffer = e.target.result;
                const data = new Uint8Array(arrayBuffer);
                
                console.log("File size:", data.length, "bytes");
                
                if (data.length < 100) {
                    throw new Error("File too small - not a valid Hollow Knight save file");
                }
                
                for (let i = 0; i < cSharpHeader.length; i++) {
                    if (data[i] !== cSharpHeader[i]) {
                        throw new Error("Invalid file header - not a Hollow Knight save file");
                    }
                }
                
                console.log("Decoding file...");
                const jsonString = Decode(data);
                console.log("Successfully decoded JSON, length:", jsonString.length);
                
                const jsonData = JSON.parse(jsonString);
                
                console.log("Modifying data...");
                const modifiedJson = modifyJsonData(jsonData);
                const modifiedJsonString = JSON.stringify(modifiedJson);
                
                console.log("Encoding back...");
                const newDatData = Encode(modifiedJsonString);
                
                resolve(newDatData);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(new Error("Failed to read file"));
        };
        
        reader.readAsArrayBuffer(file);
    });
}

document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file && !file.name.endsWith('.dat')) {
        alert('Please select a .dat file');
        e.target.value = '';
    }
});

document.getElementById('save').addEventListener('click', async function() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a .dat file first');
        return;
    }
    
    try {
        const originalText = this.value;
        this.value = 'Processing...';
        this.disabled = true;
        
        console.log('Starting file processing...');
        
        const modifiedData = await processSaveFile(file);
        
        const outputFilename = file.name.replace('.dat', '_modified.dat');
        DownloadData(modifiedData, outputFilename);
        
        console.log('File processing completed successfully');
        alert('File successfully processed and downloaded as ' + outputFilename + '!');
        
    } catch (error) {
        console.error('Error processing file:', error);
        alert('Error processing file: ' + error.message + '\n\nPlease make sure you selected a valid Hollow Knight save file (.dat)');
    } finally {
        this.value = 'Save';
        this.disabled = false;
    }
});