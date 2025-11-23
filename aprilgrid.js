// AprilGrid Generator
// Based on https://github.com/safijari/apriltags2_ethz/blob/master/aprilgrid/createTargetPDF.py

class AprilGridGenerator {
    constructor(svgElement) {
        this.svg = svgElement;
        this.dpi = 96; // pixels per inch
        this.cmToPixels = this.dpi / 2.54; // conversion factor
        this.NS = 'http://www.w3.org/2000/svg';
    }

    // Create an SVG rectangle element
    createRect(x, y, width, height, fill = 'black') {
        const rect = document.createElementNS(this.NS, 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('fill', fill);
        return rect;
    }

    // Generate a single AprilTag
    generateAprilTag(tagCode, totalBits, position, metricSize, tagSpacing, borderBits = 2) {
        const sqrtBits = Math.sqrt(totalBits);
        const bitSquareSize = metricSize / (sqrtBits + borderBits * 2);
        
        const xPos = position[0];
        const yPos = position[1];
        const borderSize = borderBits * bitSquareSize;

        // Draw borders (2x bit size, all black)
        this.svg.appendChild(this.createRect(xPos, yPos, metricSize, borderSize)); // bottom
        this.svg.appendChild(this.createRect(xPos, yPos + metricSize - borderSize, metricSize, borderSize)); // top
        this.svg.appendChild(this.createRect(xPos + metricSize - borderSize, yPos, borderSize, metricSize)); // right
        this.svg.appendChild(this.createRect(xPos, yPos, borderSize, metricSize)); // left

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
        for (let i = 0; i < sqrtBits; i++) {
            for (let j = 0; j < sqrtBits; j++) {
                if (rotatedMatrix[i][j]) {
                    this.svg.appendChild(this.createRect(
                        xPos + (j + borderBits) * bitSquareSize,
                        yPos + ((borderBits - 1) + sqrtBits - i) * bitSquareSize,
                        bitSquareSize,
                        bitSquareSize
                    ));
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
            this.svg.appendChild(this.createRect(point[0], point[1], metricSquareSize, metricSquareSize));
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
        
        // Calculate SVG size
        const gridWidth = nCols * tagSizePixels + (nCols - 1) * spacingPixels;
        const gridHeight = nRows * tagSizePixels + (nRows - 1) * spacingPixels;
        
        // Add margins for corner squares and axis
        const marginX = tagSpacing * tagSizePixels * 2;
        const marginY = tagSpacing * tagSizePixels * 2;
        
        const svgWidth = gridWidth + marginX * 2;
        const svgHeight = gridHeight + marginY * 2;

        // Clear and set SVG size
        while (this.svg.firstChild) {
            this.svg.removeChild(this.svg.firstChild);
        }
        this.svg.setAttribute('width', svgWidth);
        this.svg.setAttribute('height', svgHeight);
        this.svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);

        // Add white background
        this.svg.appendChild(this.createRect(0, 0, svgWidth, svgHeight, 'white'));

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
        this.drawText('x', axisPos[0] + arrowLength + 5, axisPos[1] + 5, tagSizePixels * 0.15, 'red');

        // Y-axis (green)
        this.drawArrow(
            axisPos[0], axisPos[1],
            axisPos[0], axisPos[1] + arrowLength,
            arrowSize, 'green'
        );
        this.drawText('y', axisPos[0] - 10, axisPos[1] + arrowLength + 5, tagSizePixels * 0.15, 'green');

        // Caption
        const caption = `${nCols}x${nRows}`;
        this.drawText(caption, axisPos[0] + arrowLength * 2, axisPos[1] + arrowLength * 0.5, tagSizePixels * 0.1, 'black');

        return {
            width: svgWidth,
            height: svgHeight,
            tagSizePixels: tagSizePixels,
            numTags: Math.min(numTags, familyData.codes.length)
        };
    }

    // Draw text
    drawText(text, x, y, fontSize, fill = 'black') {
        const textEl = document.createElementNS(this.NS, 'text');
        textEl.setAttribute('x', x);
        textEl.setAttribute('y', y);
        textEl.setAttribute('font-size', fontSize);
        textEl.setAttribute('font-family', 'Arial');
        textEl.setAttribute('fill', fill);
        textEl.textContent = text;
        this.svg.appendChild(textEl);
    }

    // Draw an arrow
    drawArrow(x1, y1, x2, y2, headSize, color) {
        const angle = Math.atan2(y2 - y1, x2 - x1);

        // Draw line
        const line = document.createElementNS(this.NS, 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', 2);
        this.svg.appendChild(line);

        // Draw arrowhead
        const arrowHead = document.createElementNS(this.NS, 'polygon');
        const points = [
            [x2, y2],
            [x2 - headSize * Math.cos(angle - Math.PI / 6), y2 - headSize * Math.sin(angle - Math.PI / 6)],
            [x2 - headSize * Math.cos(angle + Math.PI / 6), y2 - headSize * Math.sin(angle + Math.PI / 6)]
        ];
        arrowHead.setAttribute('points', points.map(p => p.join(',')).join(' '));
        arrowHead.setAttribute('fill', color);
        this.svg.appendChild(arrowHead);
    }
}

// Global functions for UI interaction
function generateGrid() {
    const svg = document.getElementById('aprilgrid-svg');
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
        const generator = new AprilGridGenerator(svg);
        const result = generator.generateAprilBoard(cols, rows, tagSize, tagSpacing, tagFamily);
        
        // Update info
        const info = document.getElementById('info');
        info.innerHTML = `
            <strong>Generated:</strong> ${result.numTags} tags<br>
            <strong>SVG size:</strong> ${Math.round(result.width)}x${Math.round(result.height)} pixels<br>
            <strong>Tag size:</strong> ${Math.round(result.tagSizePixels)} pixels (${(tagSize * 100).toFixed(2)} cm)<br>
            <strong>Family:</strong> ${tagFamily}
        `;
    } catch (error) {
        alert('Error generating grid: ' + error.message);
        console.error(error);
    }
}

// Download as SVG
function downloadSVG() {
    const svg = document.getElementById('aprilgrid-svg');
    
    if (!svg.getAttribute('width')) {
        alert('Please generate a grid first');
        return;
    }

    try {
        const tagFamily = document.getElementById('tagFamily').value;
        const cols = document.getElementById('cols').value;
        const rows = document.getElementById('rows').value;
        
        // Serialize SVG
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);
        
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
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

// Download as PDF using svg2pdf.js
async function downloadPDF() {
    const svg = document.getElementById('aprilgrid-svg');
    
    if (!svg.getAttribute('width')) {
        alert('Please generate a grid first');
        return;
    }

    try {
        const tagFamily = document.getElementById('tagFamily').value;
        const cols = parseInt(document.getElementById('cols').value);
        const rows = parseInt(document.getElementById('rows').value);
        
        // Sanitize values for safe HTML insertion
        const sanitize = (str) => String(str).replace(/[<>"'&]/g, (char) => {
            const entities = {'<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;'};
            return entities[char];
        });
        
        const safeTagFamily = sanitize(tagFamily);
        const safeCols = sanitize(cols);
        const safeRows = sanitize(rows);
        
        // Check if jsPDF and svg2pdf are loaded with proper error handling
        if (typeof jspdf === 'undefined' || typeof svg2pdf === 'undefined') {
            // Fallback: Open print dialog with SVG
            const printWindow = window.open('', '_blank');
            
            // Check if popup was blocked
            if (!printWindow || printWindow.closed || typeof printWindow.closed === 'undefined') {
                alert('Popup blocked. Please allow popups for this site to use the print function, or download as SVG instead.');
                return;
            }
            
            const svgClone = svg.cloneNode(true);
            
            const width = svg.getAttribute('width');
            const height = svg.getAttribute('height');
            
            // Use textContent for safe insertion
            printWindow.document.write('<!DOCTYPE html><html><head>');
            printWindow.document.write('<meta charset="UTF-8">');
            printWindow.document.write('<title>AprilTag Grid - ' + safeTagFamily + ' ' + safeCols + 'x' + safeRows + '</title>');
            printWindow.document.write('<style>@page { margin: 0; size: ' + width + 'px ' + height + 'px; }');
            printWindow.document.write('body { margin: 0; padding: 0; } svg { display: block; }</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(svgClone.outerHTML);
            printWindow.document.write('<script>window.onload = function() { window.print(); };</script>');
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            return;
        }

        const width = parseFloat(svg.getAttribute('width'));
        const height = parseFloat(svg.getAttribute('height'));
        
        // Convert pixels to mm (assuming 96 DPI)
        const widthMm = width * 25.4 / 96;
        const heightMm = height * 25.4 / 96;
        
        // Create PDF with error handling
        try {
            const { jsPDF } = jspdf;
            if (!jsPDF) {
                throw new Error('jsPDF not properly loaded');
            }
            
            const orientation = widthMm > heightMm ? 'landscape' : 'portrait';
            const pdf = new jsPDF({
                orientation: orientation,
                unit: 'mm',
                format: [widthMm, heightMm]
            });

            // Convert SVG to PDF
            await svg2pdf(svg, pdf, {
                x: 0,
                y: 0,
                width: widthMm,
                height: heightMm
            });

            // Download
            pdf.save(`apriltag_${tagFamily}_${cols}x${rows}.pdf`);
        } catch (pdfError) {
            console.error('PDF generation error:', pdfError);
            alert('PDF generation failed. Please try downloading as SVG instead, or use the browser print function.');
        }
    } catch (error) {
        alert('Error generating PDF: ' + error.message);
        console.error(error);
    }
}

// Generate on page load and on any input change
window.addEventListener('load', function() {
    generateGrid();
    
    // Add event listeners to all input fields to regenerate on change
    document.getElementById('tagFamily').addEventListener('change', generateGrid);
    document.getElementById('cols').addEventListener('input', generateGrid);
    document.getElementById('rows').addEventListener('input', generateGrid);
    document.getElementById('tagSize').addEventListener('input', generateGrid);
    document.getElementById('tagSpacing').addEventListener('input', generateGrid);
});
