document.addEventListener('DOMContentLoaded', () => {
  const dropzone = document.getElementById('dropzone');
  const chooseBtn = document.getElementById('chooseBtn');
  const fileInput = document.getElementById('fileInput');
  const container = document.getElementById('container');

  chooseBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add('highlight');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('highlight');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('highlight');
    handleFiles(e.dataTransfer.files);
  });

  function handleFiles(files) {
  // Clear previously loaded animations
  container.innerHTML = "";

    Array.from(files).forEach(file => {
      if (file.name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const json = JSON.parse(reader.result);
            const div = document.createElement('div');
            div.className = 'animation';
            container.appendChild(div);
            lottie.loadAnimation({
              container: div,
              renderer: 'svg',
              loop: false,
              autoplay: true,
              animationData: json
            });
          } catch (e) {
            alert('Invalid JSON: ' + file.name);
          }
        };
        reader.readAsText(file);
      }
    });
  }

});
