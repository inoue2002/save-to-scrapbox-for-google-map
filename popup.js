window.addEventListener('load', async () => {
  const options = await chrome.storage.sync.get();
  const projectName = options['projectName'];
  const googleApiKey = options['googleApiKey'];
  const gyazoApiKey = options['gyazoApiKey'];
  const isGetImage = options['isGetImage'];
  const isDevMode = options['isDevMode'];

  if (isDevMode) {
    console.log('dev mode');
  }

  if (isGetImage) {
    if (!googleApiKey || !gyazoApiKey) {
      showMessage(
        '画像反映を有効化が設定でオンになっていますが、その場合はGoogleAPIKEYとGyazoAPIKEYの設定も必要です。必要でない場合はオフに切り替えてください。',
        'Error'
      );
      return;
    }
  }

  chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
    if (tabs[0].id) {
      try {
        // ユーザーが開いているページのURLを取得する
        console.log(tabs[0].url);
        // https://www.google.com/maps/place/%E5%A4%A7%E5%8E%9F%E5%B9%BD%E5%AD%A6%E5%87%BA%E7%94%9F%E5%9C%B0/@35.1782077,136.8955996,21z/data=!4m6!3m5!1s0x6003770ed4fdf405:0x5c50067642375f8c!8m2!3d35.1781948!4d136.8956928!16s%2Fg%2F11f6nklcjb
        const url = tabs[0].url;
        const splits = url.split('/');
        if (isDevMode) console.log(splits);
        if (checkPlacePage(url)) {
          const placeName = splits[5];
          // "@35.1782077,136.8955996,21z"
          const coordinate = splits[6];
          // "@35.1782077,136.8955996,21z" -> [N35.1782077,E136.8955996,Z13 大原幽学出生地]
          const location = convertLocationToScrapboxMapNotation(coordinate, placeName);
          let body = '';
          // 画像取得がオンになっている場合
          if (isGetImage) {
            // 画像のリクエストを行う
            // locationと画像のURLをくっつけてBodyにする
            const imageUrl = await getImageUrl(googleApiKey, gyazoApiKey, placeName);
            if (imageUrl !== '') {
              body = encodeURI(`[${imageUrl}]\n\n\n`) + `${location}`;
            } else {
              body = location;
            }
          } else {
            // 画像取得がオフになっている場合
            // locationのみをbodyに入れる
            body = `${location}`;
          }
          if (projectName && placeName && body !== '') {
            if (isDevMode) console.log(`https://scrapbox.io/${projectName}/${placeName}?body=${body}`);
            if (isDevMode) {
              showMessage(`https://scrapbox.io/${projectName}/${placeName}?body=${body}`, 'DEV');
            } else {
              chrome.tabs.create({ url: `https://scrapbox.io/${projectName}/${placeName}?body=${body}` });
            }
          }
        } else {
          showMessage('URLが適切ではありません', 'Error');
        }
      } catch (e) {
        console.log(e);
        showMessage(e.message, 'Error');
        throw new Error(e);
      }
    }
  });
});

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

function checkPlacePage(url) {
  const splits = url.split('/');
  return splits[0] === 'https:' && splits[1] === '' && splits[3] === 'maps' && splits[4] === 'place';
}

function convertLocationToScrapboxMapNotation(location, placeName) {
  // "@35.1782077,136.8955996,21z"を[N35.1782077,E136.8955996,Z13 大原幽学出生地]の形に変換
  let convertStr = location.replace('@', 'N');
  // @をNに置換 "N35.1782077,136.8955996,21z"
  // 2つ目のコンマの後にEを追加 "N35.1782077,E136.8955996,21z"
  convertStr = strIns(convertStr, getCommaIndex(convertStr, 0) + 1, 'E');
  // 2つ目のコンマの後より後を削除する "N35.1782077,E136.8955996,"
  convertStr = convertStr.substring(getCommaIndex(convertStr, 1) + 1, 0);
  // 'Z13'を後につける "N35.1782077,E136.8955996,Z13"
  convertStr = '[' + convertStr + 'Z13' + ' ' + placeName + ']';
  return convertStr;
}

async function findePlaceRequest(googleApiKey, placeName) {
  try {
    // searchAPIにリクエストを投げて、Photo referenceを取得する
    const placeRequestUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?fields=formatted_address%2Cname%2Crating%2Copening_hours%2Cgeometry%2Cphoto&input=${placeName}&inputtype=textquery&key=${googleApiKey}`;
    const place = await fetch(placeRequestUrl)
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (data['error_message']) {
          showMessage(data['error_message']);
          throw new Error(data['error_message']);
        }
        return data.candidates[0];
      });
    return place;
  } catch (e) {
    console.log('findePlaceRequestに失敗しました');
    throw new Error(e);
  }
}

async function getImageFromPhotoReference(googleApiKey, photoReference) {
  try {
    const imageRequestUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoReference}&key=${googleApiKey}`;
    const res = await fetch(imageRequestUrl);
    const blob = await res.blob();
    return blob;
  } catch (e) {
    console.log('photoReferenceからの画像の取得に失敗しました');
    throw new Error(e);
  }
}

async function uploadGyazo(gyazoApiKey, blob) {
  try {
    const formData = new FormData();
    formData.append('imagedata', blob, 'image.jpg');
    formData.append('access_token', gyazoApiKey);
    formData.append('title', 'my picture');
    formData.append('desc', 'upload from node');

    const gyazoResponse = await fetch('https://upload.gyazo.com/api/upload', {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      body: formData,
    })
      .then(async (response) => {
        if (response.status !== 200) {
          throw new Error();
        }
        return response.json();
      })
      .catch((e) => {
        throw new Error('Image upload to Gyazo failed');
      });
    return gyazoResponse.permalink_url;
  } catch (e) {
    console.log('Gyazoへのアップロードで失敗しました');
    throw new Error(e);
  }
}

async function getImageUrl(googleApiKey, gyazoApiKey, placeName) {
  try {
    const place = await findePlaceRequest(googleApiKey, placeName);
    if (place.photos && place.photos.length !== 0) {
      const photoReference = place.photos[0].photo_reference;
      const blob = await getImageFromPhotoReference(googleApiKey, photoReference);
      const imageUrl = await uploadGyazo(gyazoApiKey, blob);
      return imageUrl;
    } else {
      return '';
    }
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}

function showMessage(message, type) {
  document.querySelector('#msg').innerText = type ? `${type} : ${message}` : message;
}
