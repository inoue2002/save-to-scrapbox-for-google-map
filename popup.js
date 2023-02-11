// 該当するURLかどうかを判定する
// 該当するURLの場合は名前と緯度軽度を取得する
// scrapboxに転載するリンクを作成する
// scrapboxのpjNameをconfigから取得する
// ページに繊維させる
window.addEventListener('load', () => {
  console.log('hello!');
  chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
    if (tabs[0].id) {
      const res = await chrome.storage.sync.get(null, (options) => {
        const projectName = options.projectName;
        // ユーザーが開いているページのURLを取得する
        console.log(tabs[0].url);
        // https://www.google.com/maps/place/%E5%A4%A7%E5%8E%9F%E5%B9%BD%E5%AD%A6%E5%87%BA%E7%94%9F%E5%9C%B0/@35.1782077,136.8955996,21z/data=!4m6!3m5!1s0x6003770ed4fdf405:0x5c50067642375f8c!8m2!3d35.1781948!4d136.8956928!16s%2Fg%2F11f6nklcjb
        const url = tabs[0].url;
        const splits = url.split('/');
        console.log(splits);
        if (
          splits[0] === 'https:' &&
          splits[1] === '' &&
          splits[2] === 'www.google.com' &&
          splits[3] === 'maps' &&
          splits[4] === 'place'
        ) {
          const placeName = splits[5];
          // "@35.1782077,136.8955996,21z"
          // [N35.1782077,E136.8955996,Z21 大原幽学出生地]
          // "@35.1782077,136.8955996,21z"
          // [N35.1782077,E136.8955996,Z21 大原幽学出生地]
          const moto = splits[6];
          // @をNに置換
          let newMoji = moto.replace('@', 'N');
          console.log(newMoji);
          // 2つ目のコンマの後にEを追加
          newMoji = strIns(newMoji, getCommaIndex(newMoji, 0) + 1, 'E');
          console.log(newMoji);
          // 2つ目のコンマの後より後を削除する
          newMoji = newMoji.substring(getCommaIndex(newMoji, 1) + 1, 0);
          console.log(newMoji);
          // 'Z21'を後につける
          newMoji = '[' + newMoji + 'Z16' + ' ' + placeName + ']';
          console.log(newMoji);
          //   const body = encodeURI(`${newMoji}`);
          const body = `${newMoji}`;
          if (projectName && placeName) {
            console.log(newMoji);
            console.log(`https://scrapbox.io/${projectName}/${placeName}?body=${body}`);
            chrome.tabs.create({ url: `https://scrapbox.io/${projectName}/${placeName}?body=${body}` });
          } else {
            alert(`err! \n projectName: ${projectName} \n
        userNameElement: ${userName} \n
        imageUrl: ${imageUrl} \n
        name: ${name} \n
        bio: ${bio}`);
          }
        } else {
          console.log('URLが適切ではありません');
        }
      });
    }
  });
});

document.getElementById('btn').addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: onRun,
  });
});

function onRun() {
  chrome.storage.sync.get(null, (options) => {
    document.body.style.backgroundColor = options.colorValue;
  });
}

function strIns(str, idx, val) {
  const res = str.slice(0, idx) + val + str.slice(idx);
  return res;
}

function strDel(str, idx) {
  const res = str.slice(0, idx) + str.slice(idx + 1);
  return res;
}

function getCommaIndex(str, idx) {
  const p = /[,]+/g;
  let result;
  const array = [];
  while ((result = p.exec(str))) {
    array.push(result.index);
  }
  return array[idx];
}
