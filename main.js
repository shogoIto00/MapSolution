/* jshint curly:true, debug:true */
/* globals $, firebase */
//var storage = firebase.storage();
//var icon_food = storage.refFromURL('gs://map-965b2.appspot.com/food-donation.png');

//マップで表示するアイコン
var image_food = 'https://firebasestorage.googleapis.com/v0/b/map-965b2.appspot.com/o/icon%2Ffood-donation.png?alt=media&token=b9fc64b2-7ad1-4be4-8980-83c9cc0e17d4';
var image_season = 'https://firebasestorage.googleapis.com/v0/b/map-965b2.appspot.com/o/icon%2Fseason.png?alt=media&token=09e68168-6d8a-4688-8f65-e3a747e8216d';
var image_nature = 'https://firebasestorage.googleapis.com/v0/b/map-965b2.appspot.com/o/icon%2Friver.png?alt=media&token=57ac25fe-deef-439f-90d7-f291c1ac6aa9';
var image_landmark = 'https://firebasestorage.googleapis.com/v0/b/map-965b2.appspot.com/o/icon%2Fsightseeing_spot.png?alt=media&token=f443f78a-adec-426f-9c9b-4585e60ad2e3';
var image_hotels = 'https://firebasestorage.googleapis.com/v0/b/map-965b2.appspot.com/o/icon%2Fhotel.png?alt=media&token=78edb105-70f1-4339-939d-09f754363b7b';


//初期値
// 現在ログインしているユーザID
let currentUID;

/*var icon_food = {
  url: image_food,
  // This marker is 20 pixels wide by 32 pixels high.
  size: new google.maps.Size(30, 30),
  // The origin for this image is (0, 0).
  origin: new google.maps.Point(0, 0),
  // The anchor for this image is the base of the flagpole at (0, 32).
  anchor: new google.maps.Point(0, 30)
};*/
// 書籍一覧画面に書籍データを表示する
const addMarkerOnMap = (mapId, mapData, map) => {
  var marker_var = {lat: Number(mapData.mapLat), lng: Number(mapData.mapLng) };
  var marker ;
  if (mapData.mapCategory == 'グルメ') {
    marker = new google.maps.Marker({position: marker_var, map: map, icon: {url: image_food, scaledSize: new google.maps.Size(40, 40)},});
  } else if(mapData.mapCategory == '自然'){
    marker = new google.maps.Marker({position: marker_var, map: map, icon: {url: image_nature, scaledSize: new google.maps.Size(40, 40)},});
  } else if(mapData.mapCategory == '季節の景色'){
    marker = new google.maps.Marker({position: marker_var, map: map, icon: {url: image_season, scaledSize: new google.maps.Size(40, 40)},});
  } else if(mapData.mapCategory == '観光施設'){
    marker = new google.maps.Marker({position: marker_var, map: map, icon: {url: image_landmark, scaledSize: new google.maps.Size(40, 40)},});
  } else if(mapData.mapCategory == '宿泊施設'){
    marker = new google.maps.Marker({position: marker_var, map: map, icon: {url: image_hotels, scaledSize: new google.maps.Size(40, 40)},});
  }

  var contentString = '<div id="content">'+
      mapData.mapComment +
      '</div>';

  var infowindow = new google.maps.InfoWindow({
    content: contentString
  });
  
  marker.addListener('click', function() {
    infowindow.open(map, marker);
  });
  

};

//地図情報
var map;
var global_lat;
var global_lng;
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), { // #sampleに地図を埋め込む
    center: { // 地図の中心を指定
      lat: 35.642401 , // 緯度
      lng: 139.671843 // 経度
    },
    zoom: 15 // 地図のズームを指定
  });
}


/**
 * -------------------
 * 書籍一覧画面関連の関数
 * -------------------
 */

// 書籍の表紙画像をダウンロードする
const downloadMapImage = mapImageLocation => firebase
  .storage()
  .ref(mapImageLocation)
  .getDownloadURL() // map-images/abcdef のようなパスから画像のダウンロードURLを取得
  .catch((error) => {
    console.error('写真のダウンロードに失敗:', error);
  });

// 書籍の表紙画像を表示する
const displayMapImage = ($divTag, url) => {
  $divTag.find('.map-item__image').attr({
    src: url,
  });
};

// Realtime Database の maps か投稿を削除する
const deleteMap = (mapId) => {
  // TODO: maps から該当の書籍データを削除
  var data_for_delete = firebase.database().ref(`maps/${currentUID}/`+ mapId);
  data_for_delete.remove()
    .then(function() {
      console.log("Remove succeeded.")
    })
    .catch(function(error) {
      console.log("Remove failed: " + error.message)
    });
};

// 投稿の表示用のdiv（jQueryオブジェクト）を作って返す
const createMapDiv = (mapId, mapData) => {
  // HTML内のテンプレートからコピーを作成する
  const $divTag = $('#map-template > .map-item').clone();

  // 投稿タイトルを表示する
  $divTag.find('.map-item__title').text(mapData.mapTitle);
  $divTag.find('.map-item__comment').text(mapData.mapComment);

  // 投稿の表紙画像をダウンロードして表示する
  downloadMapImage(mapData.mapImageLocation).then((url) => {
    displayMapImage($divTag, url);
  });

  // id属性をセット
  $divTag.attr('id', `map-id-${mapId}`);

  // 削除ボタンのイベントハンドラを登録
  const $deleteButton = $divTag.find('.map-item__delete');
  $deleteButton.on('click', () => {
    deleteMap(mapId);
  });

  return $divTag;
};

//投稿籍一覧画面内の投稿データをクリア
const resetMapinfofView = () => {
  $('#map-list').empty();
};

// 書籍一覧画面に書籍データを表示する
const addMap = (mapId, mapData) => {
  const $divTag = createMapDiv(mapId, mapData);
  $divTag.appendTo('#map-list');
};

// 投稿画面の初期化、イベントハンドラ登録処理
const loadMapinfoView = () => {
  resetMapinfofView();

  //投稿データを取得
  const mapsRef = firebase
    .database()
    .ref(`maps/${currentUID}/` )
    .orderByChild('createdAt');

  // 過去に登録したイベントハンドラを削除
  mapsRef.off('child_removed');
  mapsRef.off('child_added');

  // maps の child_removedイベントハンドラを登録
  // （データベースから書籍が削除されたときの処理）
  mapsRef.on('child_removed', (mapSnapshot) => {
    const mapId = mapSnapshot.key;
    const $map = $(`#map-id-${mapId}`);

    // 投稿一覧画面から該当の書籍データを削除する
    $map.remove();

  });

  // maps の child_addedイベントハンドラを登録
  // （データベースに書籍が追加保存されたときの処理）
  mapsRef.on('child_added', (mapSnapshot) => {
    const mapId = mapSnapshot.key;
    const mapData = mapSnapshot.val();
    console.log(mapId);

    // 書籍一覧画面に書籍データを表示する
    addMap(mapId, mapData);
    addMarkerOnMap(mapId, mapData, map);
  });
};

/**
 * ----------------------
 * すべての画面共通で使う関数
 * ----------------------
 */

// ビュー（画面）を変更する
const showView = (id) => {
  $('.view').hide();
  $(`#${id}`).fadeIn();

  if (id === 'mapInfo') {
    loadMapinfoView();
  }
};

/**
 * -------------------------
 * ログイン・ログアウト関連の関数
 * -------------------------
 */

// ログインフォームを初期状態に戻す
const resetLoginForm = () => {
  $('#login__help').hide();
  $('#submit_login_modal')
    .prop('disabled', false)
    .text('ログイン');
};

// ログインした直後に呼ばれる
const onLogin = () => {
  console.log('ログイン完了');
  $('#login-modal-button').hide();
  //$('#login-modal').hide();
  $('#logout-modal-button').show();
  $('#add-info').show();
  $('#add-opinion').show();

  // 投稿一覧画面を表示
  showView('mapInfo');
};

// ログアウトした直後に呼ばれる
const onLogout = () => {
  const mapsRef = firebase.database().ref('maps');

  // 過去に登録したイベントハンドラを削除
  mapsRef.off('child_removed');
  mapsRef.off('child_added');
  //この部分は必要無い。画面自体を変える必要はなく、データを消せばそれでいいため
  //showView('login');
  
  $('#login-modal-button').show();
  $('#logout-modal-button').hide();
  $('#add-info').hide();
  $('#add-opinion').hide();
};

// ユーザ作成のときパスワードが弱すぎる場合に呼ばれる
const onWeakPassword = () => {
  resetLoginForm();
  $('#login__password').addClass('has-error');
  $('#login__help')
    .text('6文字以上のパスワードを入力してください')
    .fadeIn();
};

// ログインのときパスワードが間違っている場合に呼ばれる
const onWrongPassword = () => {
  resetLoginForm();
  $('#login__password').addClass('has-error');
  $('#login__help')
    .text('正しいパスワードを入力してください')
    .fadeIn();
};

// ログインのとき試行回数が多すぎてブロックされている場合に呼ばれる
const onTooManyRequests = () => {
  resetLoginForm();
  $('#login__submit-button').prop('disabled', true);
  $('#login__help')
    .text('試行回数が多すぎます。後ほどお試しください。')
    .fadeIn();
};

// ログインのときメールアドレスの形式が正しくない場合に呼ばれる
const onInvalidEmail = () => {
  resetLoginForm();
  $('#login__email').addClass('has-error');
  $('#login__help')
    .text('メールアドレスを正しく入力してください')
    .fadeIn();
};

// その他のログインエラーの場合に呼ばれる
const onOtherLoginError = () => {
  resetLoginForm();
  $('#login__help')
    .text('ログインに失敗しました')
    .fadeIn();
};

// ユーザ作成に失敗したことをユーザに通知する
const catchErrorOnCreateUser = (error) => {
  // 作成失敗
  console.error('ユーザ作成に失敗:', error);
  if (error.code === 'auth/weak-password') {
    onWeakPassword();
  } else {
    // その他のエラー
    onOtherLoginError(error);
  }
};

// ログインに失敗したことをユーザーに通知する
const catchErrorOnSignIn = (error) => {
  if (error.code === 'auth/wrong-password') {
    // パスワードの間違い
    onWrongPassword();
  } else if (error.code === 'auth/too-many-requests') {
    // 試行回数多すぎてブロック中
    onTooManyRequests();
  } else if (error.code === 'auth/invalid-email') {
    // メールアドレスの形式がおかしい
    onInvalidEmail();
  } else {
    // その他のエラー
    onOtherLoginError(error);
  }
};



/**
 * ------------------
 * イベントハンドラの登録
 * ------------------
 */

// ログイン状態の変化を監視する
firebase.auth().onAuthStateChanged((user) => {
  // ログイン状態が変化した
  if (user) {
    // ログイン済
    currentUID = user.uid;
    onLogin();
  } else {
    // 未ログイン
    currentUID = null;
    onLogout();
  }
});
  
    
// ログ���ンフォームが送信されたらログインする
$('#login-form-mordal').on('submit', (e) => {
  e.preventDefault();

  const $loginButton = $('#submit_login_modal');
  $loginButton.text('送信中…');

  const email = $('#login-email-modal').val();
  const password = $('#login-password-modal').val();

  // ログインを試みる
  // これまでの正常に動いていたlogin機能
  
  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then(() => {
      // ログインに成功したときの処理
      console.log('ログインしました。');

      // ログインフォームを初期状態に戻す
      resetLoginForm();
      $('#login-modal').modal('hide');
    })
    .catch((error) => {
      // ログインに失敗したときの処理
      console.error('ログインエラー', error);

      if (error.code === 'auth/user-not-found') {
        // 該当ユーザが存在しない場合は新規作成する
        firebase
          .auth()
          .createUserWithEmailAndPassword(email, password)
          .then(() => {
            // 作成成功
            console.log('ユーザを作成しました');
            // ログインに成功したときの処理
            console.log('ログインしました。');
            // ログインフォームを初期状態に戻す
            resetLoginForm();
            $('#login-modal').modal('hide');
          })
          .catch(catchErrorOnCreateUser);
      } else {
        catchErrorOnSignIn(error);
      }
      // ログインボタンを元に戻す
      $loginButton.text('ログイン');
    });
    
    
    
  //ログインフォームの修正版
  /*firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .catch((error) => {
      // ログインに失敗したときの処理
      console.log('ログイン失敗:', error);
      if (error.code === 'auth/user-not-found') {
        // 該当ユーザが存在しない場合は新規作成する
        firebase
          .auth()
          .createUserWithEmailAndPassword(email, password)
          .then(() => {
            // 作成成功
            console.log('ユーザを作成しました');
            // ログインに成功したときの処理
            console.log('ログインしました。');
            // ログインフォームを初期状態に戻す
            resetLoginForm();
          })
          .catch(catchErrorOnCreateUser);
      } else {
        catchErrorOnSignIn(error);
      }
      // ログインボタンを元に戻す
      $loginButton.text('ログイン');
    });
    */
});

// ログアウトボタンが押されたらログアウトする
$('.logout-button').on('click', () => {
  firebase
    .auth()
    .signOut()
    .catch((error) => {
      console.error('ログアウトに失敗:', error);
    });
});

/**
 * -------------------------
 * 書籍情報追加モーダル関連の処理
 * -------------------------
 */

// 観光情報の登録モーダルを初期状態に戻す
const resetAddMapModal = () => {
  $('#map-form')[0].reset();
  $('#add-map-image-label').text('');
  $('#submit_add_map')
    .prop('disabled', false)
    .text('保存する');
};

// 選択した表紙画像の、ファイル名を表示する
$('#add-map-image').on('change', (e) => {
  const input = e.target;
  const $label = $('#add-map-image-label');
  /*const file = input.files[0];

  if (file != null) {
    $label.text(file.name);
  } else {
    $label.text('ファイルを選択');
  }*/
});

// 投稿の登録処理
$('#map-form').on('submit', (e) => {
  e.preventDefault();

  // 投稿の登録ボタンを押せないようにする
  $('#submit_add_map')
    .prop('disabled', true)
    .text('送信中…');

  // 投稿データ
  const mapTitle = $('#add-map-title').val();
  const mapComment = $('#add-map-comment').val();
  const mapLat = $('#add-map-lat').val();
  const mapLng = $('#add-map-lng').val();
  const mapCategory = $('#add-map-category').val();
  
  
  /*
  const $mapImage = $('#add-map-image');
  const { files } = $mapImage[0];

  if (files.length === 0) {
    // ファイルが選択されていないなら何もしない
    return;
  }

  const file = files[0]; // 表紙画像ファイル
  const filename = file.name; // 画像ファイル名
  const mapImageLocation = `map-images/${filename}`; // 画像ファイルのアップロード先
  
  // 投稿データを保存する
  firebase
    .storage()
    .ref(mapImageLocation)
    .put(file) // Storageへファイルアップロードを実行 
    .then(() => {
      // Storageへのアップロードに成功したら、Realtime Databaseに書籍データを保存する
      const mapData = {
        mapTitle,
        mapComment,
        mapLat,
        mapLng,
        mapImageLocation,
        mapCategory,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
      };
      return firebase
        .database()
        .ref('maps')
        .push(mapData);
    })
    .then(() => {
      // 書籍一覧画面の書籍の登録モーダルを閉じて、初期状態に戻す
      $('#add-map-modal').modal('hide');
      resetAddMapModal();
    })
    .catch((error) => {
      // 失敗したとき
      console.error('エラー', error);
      resetAddMapModal();
      $('#add-map__help')
        .text('保存できませんでした。')
        .fadeIn();
    });
    */
  //ここから編集
  // 生成する文字列の長さ
  var file = base64format;
  const l = 12;
  
  //生成する文字列に含める文字セット
  const c = "abcdefghijklmnopqrstuvwxyz0123456789";
  
  const cl = c.length;
  var r = "";
  for(var i=0; i<l; i++){
    r += c[Math.floor(Math.random()*cl)];
  }
  console.log(r);
  const filename = r + '.png';
  const mapImageLocation = `map-images/${filename}`;
  console.log(mapImageLocation);
  
  firebase
    .storage()
    .ref(mapImageLocation)
    .put(blob) // Storageへファイルアップロードを実行 この部分を編集してcanvasデータを保存できるようにする
    .then(() => {
      // Storageへのアップロードに成功したら、Realtime Databaseに書籍データを保存する
      const mapData = {
        mapTitle,
        mapComment,
        mapLat,
        mapLng,
        mapImageLocation,
        mapCategory,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
      };
      return firebase
        .database()
        .ref(`/maps/${currentUID}/`)
        .push(mapData);
    })
    .then(() => {
      // 書籍一覧画面の書籍の登録モーダルを閉じて、初期状態に戻す
      $('#add-map-modal').modal('hide');
      resetAddMapModal();
    })
    .catch((error) => {
      // 失敗したとき
      console.error('エラー', error);
      resetAddMapModal();
      $('#add-map__help')
        .text('保存できませんでした。')
        .fadeIn();
    });
  
  //ここまで編集 
});



//位置情報の取得
// ユーザーの端末がGeoLocation APIに対応しているかの判定

// 対応している場合
function getLocation() {
  if( navigator.geolocation ){
    // 現在地を取得
    navigator.geolocation.getCurrentPosition(
  
  	  // [第1引数] 取得に成功した場合の関数
  	  function( position)
  	  {
  		  // 取得したデータの整理
  		 var data = position.coords ;
  
    		// データの整理
    		var lat = data.latitude ;
    		var lng = data.longitude ;
    		var alt = data.altitude ;
    		var accLatlng = data.accuracy ;
    		var accAlt = data.altitudeAccuracy ;
    		var heading = data.heading ;			//0=北,90=東,180=南,270=西
    		var speed = data.speed ;
  
  
        global_lat = Number(lat);
        global_lng = Number(lng);
        document.getElementById( "add-map-lat" ).value = global_lat ;
        document.getElementById( "add-map-lng" ).value = global_lng ;
    		// アラート表示
    			//alert( "あなたの現在位置は、\n[" + lat + "," + lng + "]\nです。" ) ;
  
    		// HTMLへの書き出し
    		/*document.getElementById( 'result' ).innerHTML = '<dl><dt>緯度</dt><dd>' + lat + '</dd><dt>経度</dt><dd>' + lng + 
    		'</dd><dt>高度</dt><dd>' + alt + '</dd><dt>緯度、経度の精度</dt><dd>' + accLatlng + '</dd><dt>高度の精度</dt><dd>' + 
    		accAlt + '</dd><dt>方角</dt><dd>' + heading + '</dd><dt>速度</dt><dd>' + speed + '</dd></dl>' ;*/
    		
    		// マーカーの新規出力
    		 var marker_var = {lat: lat, lng: lng };
    		
        // var marker_var = new google.maps.LatLng(lat, lng);
        var marker = new google.maps.Marker({position: marker_var, map: map});
        console.log('lat: ' + global_lat +  ', lng: ' + global_lng)
        map.setCenter(marker_var);
    	},
  
    	// [第2引数] 取得に失敗した場合の関数
    	function( error )
    	{
    		// エラーコード(error.code)の番号
    		// 0:UNKNOWN_ERROR				原因不明のエラー
    		// 1:PERMISSION_DENIED			利用者が位置情報の取得を許可しなかった
    		// 2:POSITION_UNAVAILABLE		電波状況などで位置情報が取得できなかった
    		// 3:TIMEOUT					位置情報の取得に時間がかかり過ぎた…
    
    		// エラー番号に対応したメッセージ
    		var errorInfo = [
    			"原因不明のエラーが発生しました…。" ,
    			"位置情報の取得が許可されませんでした…。" ,
    			"電波状況などで位置情報が取得できませんでした…。" ,
    			"位置情報の取得に時間がかかり過ぎてタイムアウトしました…。"
    		] ;
    
    		// エラー番号
    		var errorNo = error.code ;
    
    		// エラーメッセージ
    		var errorMessage = "[エラー番号: " + errorNo + "]\n" + errorInfo[ errorNo ] ;
    
    		// アラート表示
    		alert( errorMessage ) ;
    
    		// HTMLに書き出し
    		document.getElementById("result").innerHTML = errorMessage;
    	} ,
    
    	// [第3引数] オプション
    	{
    		"enableHighAccuracy": false,
    		"timeout": 12000,
    		"maximumAge": 2000,
    	}
  
    ) ;
  }
  
  // 対応していない場合
  else
  {
    // エラーメッセージ
    var errorMessage = "お使いの端末は、GeoLacation APIに対応していません。" ;
  
    // アラート表示
    alert( errorMessage ) ;
  
    // HTMLに書き出し
    document.getElementById( 'result' ).innerHTML = errorMessage ;
  }
}

//ページの読み込み後に一度位置情報を取得する
$(window).on('load', getLocation);


//カメラの起動と画像取得
var player = document.getElementById('player'); 
var snapshotCanvas = document.getElementById('snapshot');
var captureButton = document.getElementById('capture');
var img = document.getElementById('img');
var videoTracks;
var context;
var blob ;
var base64format;
var handleSuccess = function(stream) {
// Attach the video stream to the video element and autoplay.
  // 一回投稿を行ったらcanvas上にデータが投稿されるので、snapshotの部分を隠しておく
  $('#snapshot').hide();
  player.srcObject = stream;
  videoTracks = stream.getVideoTracks();
  //一回登録した場合は隠れているのでshowで表示させる
  $('#player').show();
  $('#capture').show();
};

captureButton.addEventListener('click', function() {
  
  context = snapshot.getContext('2d');
  // Draw the video frame to the canvas.
  $('#snapshot').attr('width', player.videoWidth*0.6);
  $('#snapshot').attr('height', player.videoHeight*0.6);
  context.scale(0.6,0.6);
  context.drawImage(player, 0, 0,player.videoWidth, player.videoHeight);
  //img.src = context.toDataURL('image/png');
  // カメラへのアクセスを止める
  videoTracks.forEach(function(track) {track.stop()});
  $('#player').hide();
  $('#capture').hide();
  //snapshotは隠しているので、ここで表示する
  $('#snapshot').show();
  
  //339行目で使用
  var type = 'image/png';
  // canvas から DataURL で画像を出力
  base64format = snapshotCanvas.toDataURL();
  // DataURL のデータ部分を抜き出し、Base64からバイナリに変換
  var bin = atob(base64format.split(',')[1]);
  // 空の Uint8Array ビューを作る
  var buffer = new Uint8Array(bin.length);
  // Uint8Array ビューに 1 バイトずつ値を埋める
  for (var i = 0; i < bin.length; i++) {
    buffer[i] = bin.charCodeAt(i);
  }
  // Uint8Array ビューのバッファーを抜き出し、それを元に Blob を作る
  blob = new Blob([buffer.buffer], {type: type});
  
  //console.log('format: ' + base64format);
  console.log('blob: ' + blob);
});

function cameraOn(){
  navigator.mediaDevices.getUserMedia({video: true})
    .then(handleSuccess);
}

var video = document.querySelector('#video');


//×ボタンを押して投稿せずに画面を閉じたときにもカメラをオフにするための機能
$('#closebutton').on('click', function() {
  // カメラへのアクセスを止める
  videoTracks.forEach(function(track) {track.stop()});
});

$('.login-button').click( function () {
  $('#login-modal').modal('toggle');
});