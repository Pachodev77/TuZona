class ImageUploader {
    constructor(options = {}) {
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
    }

    setupEventListeners() {
        const uploadInput = this.previewContainer.querySelector('#image-upload');
        const uploadArea = this.previewContainer.querySelector('.upload-area');
        const previewGrid = this.previewContainer.querySelector('.preview-grid');

        // Handle file selection
        uploadInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        // Drag and drop events
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
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
        if (previewGrid) {
            previewGrid.addEventListener('click', (e) => {
                if (e.target.closest('.remove-image')) {
                    const previewItem = e.target.closest('.preview-item');
                    this.removeImage(previewItem);
                }
            });
        }
    }

    handleFiles(files) {
        const remainingSlots = this.maxFiles - this.uploadedImages.length;
        const filesToProcess = Array.from(files).slice(0, remainingSlots);

        filesToProcess.forEach(file => {
            this.handleFileUpload(file);
        });
    }

    async handleFileUpload(file) {
        // Validate file type
        const fileType = file.name.split('.').pop().toLowerCase();
        if (!this.allowedFormats.includes(fileType)) {
            this.showError(`Formato de archivo no permitido. Usa: ${this.allowedFormats.join(', ')}`);
            return;
        }

        // Validate file size
        if (file.size > this.maxFileSize * 1024 * 1024) {
            this.showError(`El archivo es demasiado grande. Tamaño máximo: ${this.maxFileSize}MB`);
            return;
        }

        // Create preview
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                // First create a preview with the local file URL
                const fileData = {
                    file: file,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    url: e.target.result
                };

                const preview = this.createPreviewElement(e.target.result, fileData);
                const previewGrid = this.previewContainer.querySelector('.preview-grid');
                if (previewGrid) {
                    previewGrid.appendChild(preview);
                }

                // Upload to Cloudinary
                const cloudinaryUrl = await this.uploadToCloudinary(file);
                
                // Update the preview with the Cloudinary URL
                const img = preview.querySelector('img');
                if (img) {
                    img.src = cloudinaryUrl;
                    img.dataset.file = JSON.stringify({
                        name: file.name,
                        url: cloudinaryUrl
                    });
                }

                // Add to uploaded images array
                this.uploadedImages.push({
                    file: {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        url: cloudinaryUrl
                    },
                    previewElement: preview
                });

                // Update UI
                this.updateUploadArea();

                // Call onUploadComplete if this is the first image
                if (this.uploadedImages.length === 1 && this.onUploadComplete) {
                    this.onUploadComplete(cloudinaryUrl);
                }
                
            } catch (error) {
                console.error('Error handling file upload:', error);
                this.showError('Error al procesar la imagen. Por favor, inténtalo de nuevo.');
                // Remove the preview if it was added
                const preview = this.previewContainer.querySelector('.preview-item:last-child');
                if (preview) {
                    preview.remove();
                }
            }
        };
        
        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            this.showError('Error al leer el archivo. Intenta con otra imagen.');
        };
        
        reader.readAsDataURL(file);
    }

    async uploadToCloudinary(file) {
        // Get configuration from cloudinaryConfig
        const { cloudName, uploadPreset, folder } = window.cloudinaryConfig || {};
        
        if (!cloudName || !uploadPreset) {
            console.error('Cloudinary configuration is missing');
            throw new Error('Error de configuración de Cloudinary');
        }
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        
        // Add folder if specified
        if (folder) {
            formData.append('folder', folder);
        }
        
        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );
            
            if (!response.ok) {
                throw new Error('Upload failed');
            }
            
            const data = await response.json();
            return data.secure_url;
            
        } catch (error) {
            console.error('Error uploading to Cloudinary:', error);
            throw error;
        }
    }

    createPreviewElement(imageUrl, fileData) {
        const preview = document.createElement('div');
        preview.className = 'preview-item';
        preview.innerHTML = `
            <img src="${imageUrl}" alt="${fileData.name}" data-file='${JSON.stringify(fileData).replace(/'/g, "'")}'>
            <button type="button" class="remove-image" title="Eliminar imagen">
                <i class="fas fa-times"></i>
            </button>
        `;
        return preview;
    }

    removeImage(previewItem) {
        if (!previewItem) return;
        
        // Remove from DOM
        previewItem.remove();
        
        // Remove from uploaded images array
        this.uploadedImages = this.uploadedImages.filter(
            img => img.previewElement !== previewItem
        );
        
        // Reset file input if no images left
        if (this.uploadedImages.length === 0) {
            const fileInput = this.previewContainer.querySelector('#image-upload');
            if (fileInput) fileInput.value = '';
        }
        
        this.updateUploadArea();
    }

    updateUploadArea() {
        const uploadLabel = this.previewContainer.querySelector('.upload-label');
        if (!uploadLabel) return;
        
        const remaining = this.maxFiles - this.uploadedImages.length;
        if (remaining <= 0) {
            uploadLabel.style.display = 'none';
        } else {
            uploadLabel.style.display = 'block';
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        this.previewContainer.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    getElement() {
        return this.previewContainer;
    }

    getUploadedImages() {
        return this.uploadedImages.map(img => ({
            file: img.file,
            url: img.url
        }));
    }

    clear() {
        this.uploadedImages = [];
        const previewGrid = this.previewContainer.querySelector('.preview-grid');
        if (previewGrid) {
            previewGrid.innerHTML = '';
        }
        this.updateUploadArea();
    }
}

// Make it available globally
window.ImageUploader = ImageUploader;
