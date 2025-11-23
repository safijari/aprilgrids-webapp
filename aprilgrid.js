// AprilGrid Generator
// Based on https://github.com/safijari/apriltags2_ethz/blob/master/aprilgrid/createTargetPDF.py

class AprilGridGenerator {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.dpi = 96; // pixels per inch
        this.cmToPixels = this.dpi / 2.54; // conversion factor
    }

    // Generate a single AprilTag
    generateAprilTag(tagCode, totalBits, position, metricSize, tagSpacing, borderBits = 2) {
        const sqrtBits = Math.sqrt(totalBits);
        const bitSquareSize = metricSize / (sqrtBits + borderBits * 2);
        
        const xPos = position[0];
        const yPos = position[1];
        const borderSize = borderBits * bitSquareSize;

        // Draw borders (2x bit size, all black)
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(xPos, yPos, metricSize, borderSize); // bottom
        this.ctx.fillRect(xPos, yPos + metricSize - borderSize, metricSize, borderSize); // top
        this.ctx.fillRect(xPos + metricSize - borderSize, yPos, borderSize, metricSize); // right
        this.ctx.fillRect(xPos, yPos, borderSize, metricSize); // left

        // Create matrix of code
        const codeMatrix = [];
        for (let i = 0; i < sqrtBits; i++) {
            codeMatrix[i] = [];
            for (let j = 0; j < sqrtBits; j++) {
                // If bit is NOT set, it's white (1), otherwise black (0)
                const bitValue = !(tagCode & (1 << (sqrtBits * i + j)));
                codeMatrix[i][j] = bitValue ? 1 : 0;
            }
        }

        // Rotation (rotate 90 degrees twice = 180 degrees)
        // This matches rotation=2 in the Python code
        const rotatedMatrix = this.rotateMatrix90(this.rotateMatrix90(codeMatrix));

        // Draw bits
        this.ctx.fillStyle = 'black';
        for (let i = 0; i < sqrtBits; i++) {
            for (let j = 0; j < sqrtBits; j++) {
                if (rotatedMatrix[i][j]) {
                    this.ctx.fillRect(
                        xPos + (j + borderBits) * bitSquareSize,
                        yPos + ((borderBits - 1) + sqrtBits - i) * bitSquareSize,
                        bitSquareSize,
                        bitSquareSize
                    );
                }
            }
        }

        // Add symmetric corners
        const metricSquareSize = tagSpacing * metricSize;
        const corners = [
            [xPos - metricSquareSize, yPos - metricSquareSize],
            [xPos + metricSize, yPos - metricSquareSize],
            [xPos + metricSize, yPos + metricSize],
            [xPos - metricSquareSize, yPos + metricSize]
        ];

        for (const point of corners) {
            this.ctx.fillRect(point[0], point[1], metricSquareSize, metricSquareSize);
        }
    }

    // Rotate a matrix 90 degrees clockwise
    rotateMatrix90(matrix) {
        const n = matrix.length;
        const rotated = [];
        for (let i = 0; i < n; i++) {
            rotated[i] = [];
            for (let j = 0; j < n; j++) {
                rotated[i][j] = matrix[n - 1 - j][i];
            }
        }
        return rotated;
    }

    // Generate the full AprilTag board
    generateAprilBoard(nCols, nRows, tagSize, tagSpacing, tagFamily) {
        // Get tag family data
        const familyData = TagFamilies[tagFamily];
        if (!familyData) {
            throw new Error(`Unknown tag family: ${tagFamily}`);
        }

        // Convert from meters to pixels
        const tagSizePixels = tagSize * 100 * this.cmToPixels;
        const spacingPixels = tagSpacing * tagSizePixels;
        
        // Calculate canvas size
        const gridWidth = nCols * tagSizePixels + (nCols - 1) * spacingPixels;
        const gridHeight = nRows * tagSizePixels + (nRows - 1) * spacingPixels;
        
        // Add margins for corner squares and axis
        const marginX = tagSpacing * tagSizePixels * 2;
        const marginY = tagSpacing * tagSizePixels * 2;
        
        const canvasWidth = gridWidth + marginX * 2;
        const canvasHeight = gridHeight + marginY * 2;

        // Set canvas size
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;

        // Fill with white background
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw tags
        const numTags = nCols * nRows;
        for (let y = 0; y < nRows; y++) {
            for (let x = 0; x < nCols; x++) {
                const id = nCols * y + x;
                if (id >= familyData.codes.length) {
                    console.warn(`Tag ID ${id} exceeds available codes for ${tagFamily}`);
                    continue;
                }
                
                const tagCode = familyData.codes[id];
                const pos = [
                    marginX + x * (tagSizePixels + spacingPixels),
                    marginY + y * (tagSizePixels + spacingPixels)
                ];
                
                this.generateAprilTag(
                    tagCode,
                    familyData.bits,
                    pos,
                    tagSizePixels,
                    tagSpacing
                );
            }
        }

        // Draw coordinate axes
        const axisPos = [
            marginX - 1.5 * spacingPixels,
            marginY - 1.5 * spacingPixels
        ];
        const arrowLength = tagSizePixels * 0.3;
        const arrowSize = tagSizePixels * 0.10;

        // X-axis (red)
        this.drawArrow(
            axisPos[0], axisPos[1],
            axisPos[0] + arrowLength, axisPos[1],
            arrowSize, 'red'
        );
        this.ctx.fillStyle = 'red';
        this.ctx.font = `${tagSizePixels * 0.15}px Arial`;
        this.ctx.fillText('x', axisPos[0] + arrowLength + 5, axisPos[1] + 5);

        // Y-axis (green)
        this.drawArrow(
            axisPos[0], axisPos[1],
            axisPos[0], axisPos[1] + arrowLength,
            arrowSize, 'green'
        );
        this.ctx.fillStyle = 'green';
        this.ctx.fillText('y', axisPos[0] - 10, axisPos[1] + arrowLength + 5);

        // Caption
        const caption = `${nCols}x${nRows} tags, size=${(tagSize * 100).toFixed(2)}cm, spacing=${(tagSpacing * tagSize * 100).toFixed(2)}cm`;
        this.ctx.fillStyle = 'black';
        this.ctx.font = `${tagSizePixels * 0.1}px Arial`;
        this.ctx.fillText(caption, axisPos[0] + arrowLength * 2, axisPos[1] + arrowLength * 0.5);

        return {
            width: canvasWidth,
            height: canvasHeight,
            tagSizePixels: tagSizePixels,
            numTags: Math.min(numTags, familyData.codes.length)
        };
    }

    // Draw an arrow
    drawArrow(x1, y1, x2, y2, headSize, color) {
        const angle = Math.atan2(y2 - y1, x2 - x1);

        // Draw line
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw arrowhead
        this.ctx.beginPath();
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(
            x2 - headSize * Math.cos(angle - Math.PI / 6),
            y2 - headSize * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.lineTo(
            x2 - headSize * Math.cos(angle + Math.PI / 6),
            y2 - headSize * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.closePath();
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }
}

// Global functions for UI interaction
function generateGrid() {
    const canvas = document.getElementById('canvas');
    const tagFamily = document.getElementById('tagFamily').value;
    const cols = parseInt(document.getElementById('cols').value);
    const rows = parseInt(document.getElementById('rows').value);
    const tagSize = parseFloat(document.getElementById('tagSize').value);
    const tagSpacing = parseFloat(document.getElementById('tagSpacing').value);

    // Validation
    if (cols < 1 || rows < 1) {
        alert('Grid size must be at least 1x1');
        return;
    }
    if (tagSize <= 0) {
        alert('Tag size must be greater than 0');
        return;
    }
    if (tagSpacing < 0 || tagSpacing > 1) {
        alert('Tag spacing must be between 0 and 1');
        return;
    }

    try {
        const generator = new AprilGridGenerator(canvas);
        const result = generator.generateAprilBoard(cols, rows, tagSize, tagSpacing, tagFamily);
        
        // Update info
        const info = document.getElementById('info');
        info.innerHTML = `
            <strong>Generated:</strong> ${result.numTags} tags<br>
            <strong>Canvas size:</strong> ${Math.round(result.width)}x${Math.round(result.height)} pixels<br>
            <strong>Tag size:</strong> ${Math.round(result.tagSizePixels)} pixels (${(tagSize * 100).toFixed(2)} cm)<br>
            <strong>Family:</strong> ${tagFamily}
        `;
    } catch (error) {
        alert('Error generating grid: ' + error.message);
        console.error(error);
    }
}

function downloadPDF() {
    const canvas = document.getElementById('canvas');
    
    if (!canvas.width || !canvas.height) {
        alert('Please generate a grid first');
        return;
    }

    try {
        // For now, download as PNG
        // In a production environment, you could use jsPDF or server-side PDF generation
        const tagFamily = document.getElementById('tagFamily').value;
        const cols = document.getElementById('cols').value;
        const rows = document.getElementById('rows').value;
        
        // Create high-resolution canvas for PDF-quality output
        const scale = 3; // 3x resolution for better quality
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width * scale;
        tempCanvas.height = canvas.height * scale;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Scale and draw
        tempCtx.scale(scale, scale);
        tempCtx.drawImage(canvas, 0, 0);
        
        // Convert to blob and download
        tempCanvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `apriltag_${tagFamily}_${cols}x${rows}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 'image/png');
        
    } catch (error) {
        alert('Error generating download: ' + error.message);
        console.error(error);
    }
}

// Alternative: Download as SVG for vector graphics
function downloadSVG() {
    const canvas = document.getElementById('canvas');
    
    if (!canvas.width || !canvas.height) {
        alert('Please generate a grid first');
        return;
    }

    try {
        const tagFamily = document.getElementById('tagFamily').value;
        const cols = document.getElementById('cols').value;
        const rows = document.getElementById('rows').value;
        
        // Get canvas data as PNG
        const imgData = canvas.toDataURL('image/png');
        
        // Create SVG with embedded PNG
        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${canvas.width}" height="${canvas.height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <image width="${canvas.width}" height="${canvas.height}" xlink:href="${imgData}"/>
</svg>`;
        
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `apriltag_${tagFamily}_${cols}x${rows}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        alert('Error generating SVG: ' + error.message);
        console.error(error);
    }
}

// Generate on page load
window.addEventListener('load', function() {
    generateGrid();
});
