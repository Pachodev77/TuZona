class ImageUploader {
    constructor(options = {}) {
        this.cloudName = options.cloudName || 'dxrbvgr1o';
        this.apiKey = options.apiKey || '779192924525255';
        this.apiSecret = options.apiSecret || 'A_0vO7809rgqLHw5xQC1eV4hqLI';
        this.uploadPreset = options.uploadPreset || 'tuzona_uploads';
        this.maxFiles = options.maxFiles || 5;
        this.maxFileSize = options.maxFileSize || 5; // in MB
        this.allowedFormats = options.allowedFormats || ['jpg', 'jpeg', 'png', 'webp'];
        this.uploadedImages = [];
        this.previewContainer = null;
        this.onUploadComplete = options.onUploadComplete || null;
        this.initialize();
    }

    initialize() {
        this.createUploadArea();
        this.setupEventListeners();
    }

    createUploadArea() {
        this.previewContainer = document.createElement('div');
        this.previewContainer.className = 'image-preview-container';
        this.previewContainer.innerHTML = `
            <div class="upload-area">
                <input type="file" id="image-upload" accept="image/*" multiple style="display: none;">
                <label for="image-upload" class="upload-label">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>Arrastra y suelta imágenes o haz clic para seleccionar</p>
                    <small>Máximo ${this.maxFiles} imágenes (${this.allowedFormats.join(', ').toUpperCase()}, ${this.maxFileSize}MB máximo por imagen)</small>
                </label>
                <div class="preview-grid"></div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .image-preview-container {
                margin: 20px 0;
            }
            .upload-area {
                border: 2px dashed #ccc;
                border-radius: 8px;
                padding: 30px;
                text-align: center;
                transition: all 0.3s ease;
                background: #f9f9f9;
            }
            .upload-area.drag-over {
                border-color: #4CAF50;
                background: #f0f8f0;
            }
            .upload-label {
                cursor: pointer;
                display: block;
                padding: 20px;
            }
            .upload-label i {
                font-size: 48px;
                color: #4CAF50;
                margin-bottom: 15px;
            }
            .preview-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 15px;
                margin-top: 20px;
            }
            .preview-item {
                position: relative;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                aspect-ratio: 1;
            }
            .preview-item img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .remove-image {
                position: absolute;
                top: 5px;
                right: 5px;
                background: rgba(255,0,0,0.7);
                color: white;
                border: none;
                border-radius: 50%;
                width: 25px;
                height: 25px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                opacity: 0;
                transition: opacity 0.3s;
            }
            .preview-item:hover .remove-image {
                opacity: 1;
            }
            .upload-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: rgba(0,0,0,0.1);
            }
            .progress-bar {
                height: 100%;
                background: #4CAF50;
                width: 0%;
                transition: width 0.3s;
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        const uploadInput = this.previewContainer.querySelector('#image-upload');
        const uploadArea = this.previewContainer.querySelector('.upload-area');
        const previewGrid = this.previewContainer.querySelector('.preview-grid');

        // Handle file selection
        uploadInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        // Drag and drop events
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('drag-over');
            });
        });

        uploadArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleFiles(files);
        });

        // Handle image removal
        previewGrid.addEventListener('click', (e) => {
            if (e.target.closest('.remove-image')) {
                const item = e.target.closest('.preview-item');
                const index = Array.from(previewGrid.children).indexOf(item);
                if (index > -1) {
                    this.uploadedImages.splice(index, 1);
                    item.remove();
                    this.updateFileInput();
                }
            }
        });
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleFiles(files) {
        const remainingSlots = this.maxFiles - this.uploadedImages.length;
        const filesToProcess = Array.from(files).slice(0, remainingSlots);

        filesToProcess.forEach(file => {
            if (this.validateFile(file)) {
                this.previewImage(file);
            }
        });
    }

    validateFile(file) {
        const fileType = file.type.split('/')[1];
        const isValidFormat = this.allowedFormats.includes(fileType.toLowerCase());
        const isValidSize = file.size <= this.maxFileSize * 1024 * 1024;

        if (!isValidFormat) {
            alert(`Formato de archivo no soportado. Formatos permitidos: ${this.allowedFormats.join(', ')}`);
            return false;
        }

        if (!isValidSize) {
            alert(`El archivo es demasiado grande. Tamaño máximo: ${this.maxFileSize}MB`);
            return false;
        }

        return true;
    }

    previewImage(file) {
        const reader = new FileReader();
        const previewGrid = this.previewContainer.querySelector('.preview-grid');
        
        reader.onload = (e) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button class="remove-image" title="Eliminar">&times;</button>
                <div class="upload-progress">
                    <div class="progress-bar"></div>
                </div>
            `;
            
            previewGrid.appendChild(previewItem);
            this.uploadedImages.push(file);
            this.updateFileInput();
            
            // Auto-upload the image
            this.uploadImage(file, previewItem);
        };
        
        reader.readAsDataURL(file);
    }

    async uploadImage(file, previewItem) {
        const progressBar = previewItem.querySelector('.progress-bar');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', this.uploadPreset);
        
        // For unsigned uploads, we don't need to provide api_key or signature
        // Cloudinary will use the upload_preset for authentication
        
        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Cloudinary upload response:', data);
            
            if (data.secure_url) {
                // Store the Cloudinary URL in the preview item
                const secureUrl = data.secure_url.replace(/^http:/, 'https:'); // Ensure HTTPS
                previewItem.dataset.url = secureUrl;
                progressBar.style.width = '100%';
                progressBar.style.backgroundColor = '#4CAF50';
                
                // Call the upload complete callback if provided
                if (this.onUploadComplete && typeof this.onUploadComplete === 'function') {
                    this.onUploadComplete(secureUrl);
                }
                return secureUrl;
            } else {
                console.error('No secure_url in response:', data);
                throw new Error('No se pudo obtener la URL de la imagen subida');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            progressBar.style.backgroundColor = '#f44336';
            alert('Error al subir la imagen. Por favor, inténtalo de nuevo.');
        }
    }

    updateFileInput() {
        const remainingSlots = this.maxFiles - this.uploadedImages.length;
        const uploadLabel = this.previewContainer.querySelector('.upload-label');
        
        if (remainingSlots <= 0) {
            uploadLabel.style.display = 'none';
        } else {
            uploadLabel.style.display = 'block';
        }
    }

    getUploadedImages() {
        if (!this.previewContainer) return [];
        const previewItems = this.previewContainer.querySelectorAll('.preview-item');
        return Array.from(previewItems)
            .map(item => item.dataset.url)
            .filter(url => url && url.trim() !== '');
    }

    // No need for generateSignature method with unsigned uploads using upload_preset

    getElement() {
        return this.previewContainer;
    }
    
    // Clear all uploaded images
    clear() {
        if (this.previewContainer) {
            const previewGrid = this.previewContainer.querySelector('.preview-grid');
            if (previewGrid) {
                previewGrid.innerHTML = '';
            }
        }
        this.uploadedImages = [];
        this.updateFileInput();
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageUploader;
} else {
    window.ImageUploader = ImageUploader;
}
