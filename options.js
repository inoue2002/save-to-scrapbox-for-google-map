window.addEventListener('load', async () => {
  await chrome.storage.sync.get(null, async (options) => {
    const projectName = options['projectName'];
    const googleApiKey = options['googleApiKey'];
    const gyazoApiKey = options['gyazoApiKey'];
    const isGetImage = options['isGetImage'];
    const isDevMode = options['isDevMode'];
    console.log({ projectName, googleApiKey, gyazoApiKey, isGetImage, isDevMode });
    if (projectName) document.getElementById('projectName').value = projectName;
    if (googleApiKey) document.getElementById('googleApiKey').value = googleApiKey;
    if (gyazoApiKey) document.getElementById('gyazoApiKey').value = gyazoApiKey;
    if (isGetImage) document.getElementById('isGetImage').checked = isGetImage;
    if (isDevMode) document.getElementById('isDevMode').checked = isDevMode;
  });
});

document.getElementById('saveButton').addEventListener('click', (/*e*/) => {
  const projectName = document.getElementById('projectName').value;
  const googleApiKey = document.getElementById('googleApiKey').value;
  const gyazoApiKey = document.getElementById('gyazoApiKey').value;
  const isGetImage = document.getElementById('isGetImage').checked;
  const isDevMode = document.getElementById('isDevMode').checked;
  const options = {
    projectName,
    googleApiKey,
    gyazoApiKey,
    isGetImage,
    isDevMode
  };
  chrome.storage.sync.set(options);
  document.querySelector('#msg').innerText = '✅ Saved!';
  setTimeout(() => {
    document.querySelector('#msg').innerText = '';
  }, 3000);
});
