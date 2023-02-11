document.getElementById('checkButton').addEventListener('click', async (e) => {
  const projectName = document.getElementById('nameText').value;
  const options = {
    projectName,
  };
  chrome.storage.sync.set(options);
  document.querySelector('#msg').innerText = `Save to ProjectName : ${options.projectName} !`;
});
