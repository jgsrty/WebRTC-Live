function go2Room() {
  let roomid = document.getElementById("roomNumber");
  if (roomid.value) {
    window.location.href = "room.html?room=" + roomid.value;
  } else {
    alert("请输入房间号");
  }
}
