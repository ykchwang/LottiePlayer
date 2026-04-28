class JSONAnimationPreviewer {
  constructor() {
    this.animations = [];
    this.currentAnimationIndex = 0;
    this.animationData = null;
    this.isPlaying = false;
    this.currentFrame = 0;
    this.totalFrames = 0;
    this.animationElements = [];
    this.animationInterval = null;
    this.lottieAnim = null;
    this.loop = true;
    this.bgColor = '#ffffff';

    this.initializeEventListeners();
  }

  initializeEventListeners() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    // File upload handling
    uploadArea.addEventListener('click', () => fileInput.click());
    document.getElementById('uploadBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
    uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
    uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
    uploadArea.addEventListener('drop', this.handleDrop.bind(this));

    fileInput.addEventListener('change', this.handleFileSelect.bind(this));

    // Control buttons
    document.getElementById('playBtn').addEventListener('click', this.togglePlayPause.bind(this));
    document.getElementById('resetBtn').addEventListener('click', this.reset.bind(this));

    // Timeline
    document.getElementById('timelineSlider').addEventListener('input', this.seek.bind(this));

    // Loop toggle
    document.getElementById('loopToggle').addEventListener('change', (e) => {
      this.loop = e.target.checked;
      if (this.lottieAnim) this.lottieAnim.loop = this.loop;
    });

    // Navigation
    document.getElementById('prevBtn').addEventListener('click', () => this.navigateTo(this.currentAnimationIndex - 1));
    document.getElementById('nextBtn').addEventListener('click', () => this.navigateTo(this.currentAnimationIndex + 1));

    // Background swatches
    const swatches = { bgLight: '#ffffff', bgDark: '#121212' };
    Object.entries(swatches).forEach(([id, color]) => {
      document.getElementById(id).addEventListener('click', () => {
        this.bgColor = color;
        document.getElementById('animationCanvas').style.background = color;
        document.getElementById('bgLight').classList.toggle('active', id === 'bgLight');
        document.getElementById('bgDark').classList.toggle('active', id === 'bgDark');
      });
    });
  }

  handleDragOver(e) {
    e.preventDefault();
    document.getElementById('uploadArea').classList.add('dragover');
  }

  handleDragLeave(e) {
    e.preventDefault();
    document.getElementById('uploadArea').classList.remove('dragover');
  }

  handleDrop(e) {
    e.preventDefault();
    document.getElementById('uploadArea').classList.remove('dragover');
    this.processFiles(e.dataTransfer.files);
  }

  handleFileSelect(e) {
    this.processFiles(e.target.files);
  }

  processFiles(files) {
    Array.from(files).forEach(file => {
      if (!file.name.endsWith('.json')) {
        this.showError('Please select JSON files only');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          this.animations.push({ data: jsonData, file });
          this.loadAnimationAt(this.animations.length - 1);
        } catch (error) {
          this.showError('Invalid JSON file: ' + error.message);
        }
      };
      reader.readAsText(file);
    });
  }

  loadAnimationAt(index) {
    this.pause();
    if (this.lottieAnim) {
      this.lottieAnim.destroy();
      this.lottieAnim = null;
    }
    this.currentAnimationIndex = index;
    const { data, file } = this.animations[index];
    this.animationData = data;
    this.showFileInfo(file, data);

    const canvas = document.getElementById('animationCanvas');
    canvas.innerHTML = '';
    this.animationElements = [];

    this.setupAnimation(data);
    document.getElementById('previewContainer').style.display = 'block';
    document.body.classList.add('has-animation');
    this.hideError();
    this.updateNav();
  }

  navigateTo(index) {
    const len = this.animations.length;
    this.loadAnimationAt((index + len) % len);
  }

  updateNav() {
    const nav = document.getElementById('fileNav');
    if (this.animations.length <= 1) {
      nav.style.display = 'none';
      return;
    }
    nav.style.display = 'flex';
    const container = document.getElementById('dotIndicators');
    container.innerHTML = '';
    this.animations.forEach((_, i) => {
      const dot = document.createElement('span');
      dot.className = 'dot' + (i === this.currentAnimationIndex ? ' active' : '');
      dot.addEventListener('click', () => this.navigateTo(i));
      container.appendChild(dot);
    });
  }

  showFileInfo(file, data) {
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = this.formatFileSize(file.size);

    let type = 'Custom JSON';
    if (data.v && data.fr && data.layers) {
      type = 'Lottie Animation';
    } else if (data.frames || data.timeline) {
      type = 'Keyframe Animation';
    }

    document.getElementById('animationType').textContent = type;
    document.getElementById('fileInfo').style.display = 'block';
  }

  setupAnimation(data) {
    const canvas = document.getElementById('animationCanvas');

    canvas.style.position = 'relative';
    canvas.style.background = this.bgColor;

    this.currentFrame = 0;
    this.isPlaying = false;

    if (this.isLottieFormat(data)) {
      this.setupLottieAnimation(data, canvas);
      document.getElementById('playBtn').disabled = false;
      document.getElementById('resetBtn').disabled = false;
    } else {
      canvas.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 8px;
          color: #d32f2f;
          font-size: 13px;
          text-align: center;
          padding: 20px;
        ">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#d32f2f"/>
          </svg>
          <strong>Not a Lottie file</strong>
          <span style="color: #888;">This JSON doesn't match the Lottie format.<br>Only Lottie animations are supported.</span>
        </div>
      `;
    }
  }

  isLottieFormat(data) {
    return data && typeof data === 'object' &&
      ('v' in data || 'version' in data) &&
      ('layers' in data || 'assets' in data);
  }

  setupLottieAnimation(data, canvas) {
    const anim = lottie.loadAnimation({
      container: canvas,
      renderer: 'svg',
      loop: this.loop,
      autoplay: false,
      animationData: data
    });

    this.lottieAnim = anim;

    anim.addEventListener('DOMLoaded', () => {
      this.totalFrames = Math.floor(anim.totalFrames);
      this.fps = anim.frameRate;
      this.setupControls(this.totalFrames, this.fps);
    });

    anim.addEventListener('enterFrame', () => {
      this.currentFrame = Math.floor(anim.currentFrame);
      document.getElementById('timelineSlider').value = this.currentFrame;
      this.updateTimeDisplay();
    });

    anim.addEventListener('complete', () => {
      if (!this.loop) this.pause();
    });
  }

  setupControls(totalFrames, fps) {
    this.totalFrames = totalFrames;
    this.fps = fps;

    const slider = document.getElementById('timelineSlider');
    slider.max = totalFrames - 1;
    slider.disabled = false;

    this.updateTimeDisplay();
  }

  togglePlayPause() {
    this.isPlaying ? this.pause() : this.play();
  }

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    document.getElementById('playBtn').innerHTML = '<svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.25 3C5.00781 3 4 4.00781 4 5.25V18.75C4 19.9922 5.00781 21 6.25 21H7.75C8.99219 21 10 19.9922 10 18.75V5.25C10 4.00781 8.99219 3 7.75 3H6.25ZM15.25 3C14.0078 3 13 4.00781 13 5.25V18.75C13 19.9922 14.0078 21 15.25 21H16.75C17.9922 21 19 19.9922 19 18.75V5.25C19 4.00781 17.9922 3 16.75 3H15.25Z" fill="white"/></svg>Pause';

    if (this.lottieAnim) {
      this.lottieAnim.loop = this.loop;
      this.lottieAnim.play();
    } else {
      this.animationInterval = setInterval(() => {
        this.currentFrame++;
        if (this.currentFrame >= this.totalFrames) {
          if (this.loop) {
            this.currentFrame = 0;
          } else {
            this.currentFrame = this.totalFrames - 1;
            this.pause();
            this.updateTimeDisplay();
            return;
          }
        }
        this.updateTimeDisplay();
      }, 1000 / this.fps);
    }
  }

  pause() {
    this.isPlaying = false;
    document.getElementById('playBtn').innerHTML = '<svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.42188 1.8279C6.72813 1.40134 5.85625 1.38727 5.14844 1.78571C4.44062 2.18415 4 2.93415 4 3.74977V20.2498C4 21.0654 4.44062 21.8154 5.14844 22.2138C5.85625 22.6123 6.72813 22.5935 7.42188 22.1716L20.9219 13.9216C21.5922 13.5138 22 12.7873 22 11.9998C22 11.2123 21.5922 10.4904 20.9219 10.0779L7.42188 1.8279Z" fill="white"/></svg>Play';
    if (this.lottieAnim) {
      this.lottieAnim.pause();
    } else {
      if (this.animationInterval) clearInterval(this.animationInterval);
    }
  }

  reset() {
    this.pause();
    this.currentFrame = 0;
    if (this.lottieAnim) {
      this.lottieAnim.goToAndStop(0, true);
    }
    this.updateTimeDisplay();
  }

  seek(e) {
    this.currentFrame = parseInt(e.target.value);
    if (this.lottieAnim) {
      this.lottieAnim.goToAndStop(this.currentFrame, true);
    }
    this.updateTimeDisplay();
  }

  updateTimeDisplay() {
    document.getElementById('currentTime').textContent = `Frame ${this.currentFrame}`;
    document.getElementById('totalTime').textContent = `${this.fps} Hz`;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorMessage').style.display = 'block';
  }

  hideError() {
    document.getElementById('errorMessage').style.display = 'none';
  }
}

new JSONAnimationPreviewer();
