// Read data from local storage
let friends = JSON.parse(localStorage.getItem("pikmin_friends")) || [];
let records = JSON.parse(localStorage.getItem("pikmin_records")) || [];
let editingPostcard = null; // Track which postcard is being edited
let editingFriend = null; // Track which friend is being edited (stores {index, oldName})

window.onload = function () {
  renderFriends();
  renderPostcards();
  renderRecordsTable();
};

// Add friend
function addFriend() {
  const name = document.getElementById("newFriendName").value.trim();
  if (!name) return;

  // If editing mode
  if (editingFriend) {
    const { index, oldName } = editingFriend;

    // Check if name already exists (and it's not the same name)
    if (name !== oldName && friends.includes(name)) {
      alert("此好友已存在");
      return;
    }

    // Update friend name in friends array
    friends[index] = name;

    // Update friend name in all records
    records.forEach((record) => {
      record.friends = record.friends.map((f) => (f === oldName ? name : f));
    });

    // Save to localStorage
    localStorage.setItem("pikmin_friends", JSON.stringify(friends));
    localStorage.setItem("pikmin_records", JSON.stringify(records));

    // Clear form and exit editing mode
    document.getElementById("newFriendName").value = "";
    exitFriendEditMode();

    renderFriends();
    renderRecordsTable();
  } else {
    // Normal add mode
    if (friends.includes(name)) {
      alert("此好友已存在");
      return;
    }

    friends.push(name);
    localStorage.setItem("pikmin_friends", JSON.stringify(friends));
    document.getElementById("newFriendName").value = "";
    renderFriends();
  }
}

// Show friend list
function renderFriends() {
  const friendListDiv = document.getElementById("friendList");

  if (friends.length === 0) {
    friendListDiv.innerHTML = '<span class="empty-state">尚未新增好友</span>';
  } else {
    friendListDiv.innerHTML =
      '<div class="friend-list-header">好友名單 (' +
      friends.length +
      ") （點選編輯）</div>" +
      '<div class="friend-list-items"></div>';

    const itemsContainer = friendListDiv.querySelector(".friend-list-items");
    friends.forEach((friend, index) => {
      const item = document.createElement("span");
      item.className = "friend-item";
      item.textContent = friend;
      item.onclick = () => editFriend(index, friend);
      item.title = "點擊編輯好友名稱";
      itemsContainer.appendChild(item);
    });
  }

  const checkboxDiv = document.getElementById("checkboxes");
  checkboxDiv.innerHTML = "選擇好友";
  friends.forEach((friend) => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" value="${friend}" class="friend-check"> ${friend}`;
    checkboxDiv.appendChild(label);
  });
}

// Add postcard record
function saveRecord() {
  const postcard = document.getElementById("postcardName").value.trim();
  if (!postcard) return alert("輸入明信片名稱");

  const checkedBoxes = document.querySelectorAll(".friend-check:checked");
  const selectedFriends = Array.from(checkedBoxes).map((cb) => cb.value);

  if (selectedFriends.length === 0) return alert("請至少選擇一位好友");

  // If editing mode, delete old records first
  if (editingPostcard) {
    records = records.filter((r) => r.postcard !== editingPostcard);
  }

  const newRecord = {
    postcard: postcard,
    friends: selectedFriends,
    date: new Date().toLocaleDateString(),
  };
  records.push(newRecord);
  localStorage.setItem("pikmin_records", JSON.stringify(records));

  document.getElementById("postcardName").value = "";
  checkedBoxes.forEach((cb) => (cb.checked = false));

  // Exit editing mode
  exitEditMode();

  renderPostcards();
  renderRecordsTable();
}

// Show postcards
function renderPostcards() {
  const uniquePostcards = [...new Set(records.map((r) => r.postcard))];
  const listElement = document.getElementById("postcardList");

  if (!listElement) return;

  if (uniquePostcards.length === 0) {
    listElement.innerHTML = '<span class="empty-state">暫無明信片紀錄</span>';
  } else {
    listElement.innerHTML =
      '<div class="postcard-list-header">已存明信片 (' +
      uniquePostcards.length +
      ' 張)（點選編輯）</div><div class="postcard-list-items"></div>';

    const itemsContainer = listElement.querySelector(".postcard-list-items");
    uniquePostcards.sort().forEach((postcard) => {
      const item = document.createElement("span");
      item.className = "postcard-list-item";
      item.textContent = postcard;
      item.onclick = () => editPostcard(postcard);
      item.title = "點擊編輯明信片";
      itemsContainer.appendChild(item);
    });
  }
}

function exportCSV() {
  let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
  csvContent += "明信片名稱,好友,寄出日期\n";

  records.forEach((record) => {
    record.friends.forEach((friend) => {
      csvContent += `${record.postcard},${friend},${record.date}\n`;
    });
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "pikmin_records.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Edit friend name
function editFriend(index, oldName) {
  editingFriend = { index, oldName };
  document.getElementById("addFriendBtn").textContent = "儲存編輯";

  document.getElementById("deleteFriendBtn").style.display = "inline-block";
  document.getElementById("cancelFriendBtn").style.display = "inline-block";

  document.getElementById("newFriendName").value = oldName;
  document.getElementById("newFriendName").scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  document.getElementById("newFriendName").focus();
  document.getElementById("newFriendName").select();
}

// Edit postcard
function editPostcard(oldPostcardName) {
  editingPostcard = oldPostcardName;

  document.getElementById("deleteBtn").style.display = "inline-block";
  document.getElementById("cancelBtn").style.display = "inline-block";

  const postcardRecords = records.filter((r) => r.postcard === oldPostcardName);

  // Get all friends who received this postcard
  let allReceivers = [];
  postcardRecords.forEach((r) => allReceivers.push(...r.friends));
  const uniqueReceivers = [...new Set(allReceivers)];

  document.getElementById("postcardName").value = oldPostcardName;
  document.querySelectorAll(".friend-check").forEach((cb) => {
    cb.checked = false;
  });

  document.querySelectorAll(".friend-check").forEach((cb) => {
    if (uniqueReceivers.includes(cb.value)) {
      cb.checked = true;
    }
  });

  document.getElementById("postcardName").scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  document.getElementById("postcardName").focus();
  document.getElementById("postcardName").select();
}

// Delete current postcard being edited
function deleteCurrentPostcard() {
  if (!editingPostcard) return;

  if (confirm(`確定要刪除「${editingPostcard}」嗎？`)) {
    records = records.filter((r) => r.postcard !== editingPostcard);
    localStorage.setItem("pikmin_records", JSON.stringify(records));

    // Clear form and exit editing mode
    document.getElementById("postcardName").value = "";
    document.querySelectorAll(".friend-check").forEach((cb) => {
      cb.checked = false;
    });
    exitEditMode();

    renderPostcards();
    renderRecordsTable();
  }
}

// Cancel editing
function cancelEdit() {
  document.getElementById("postcardName").value = "";
  document.querySelectorAll(".friend-check").forEach((cb) => {
    cb.checked = false;
  });
  exitEditMode();
}

// Exit editing mode
function exitEditMode() {
  editingPostcard = null;
  document.getElementById("deleteBtn").style.display = "none";
  document.getElementById("cancelBtn").style.display = "none";
}

// Delete current friend being edited
function deleteCurrentFriend() {
  if (!editingFriend) return;

  const { index, oldName } = editingFriend;

  if (
    confirm(`確定要刪除「${oldName}」嗎？此操作也會從明信片記錄中移除此好友。`)
  ) {
    friends.splice(index, 1);

    // Remove friend from all records
    records.forEach((record) => {
      record.friends = record.friends.filter((f) => f !== oldName);
    });

    localStorage.setItem("pikmin_friends", JSON.stringify(friends));
    localStorage.setItem("pikmin_records", JSON.stringify(records));

    document.getElementById("newFriendName").value = "";
    exitFriendEditMode();

    renderFriends();
    renderPostcards();
    renderRecordsTable();
  }
}

// Cancel friend editing
function cancelFriendEdit() {
  document.getElementById("newFriendName").value = "";
  exitFriendEditMode();
}

// Exit friend editing mode
function exitFriendEditMode() {
  editingFriend = null;
  document.getElementById("addFriendBtn").textContent = "新增好友";
  document.getElementById("deleteFriendBtn").style.display = "none";
  document.getElementById("cancelFriendBtn").style.display = "none";
}

// Render records table
function renderRecordsTable() {
  const tbody = document.getElementById("recordsTableBody");

  if (!tbody) return;
  tbody.innerHTML = "";

  if (records.length === 0) {
    const row = tbody.insertRow();
    const cell = row.insertCell(0);
    cell.colSpan = 2;
    cell.textContent = "暫無記錄";
    cell.style.textAlign = "center";
    cell.style.color = "#999";
    cell.style.fontStyle = "italic";
    return;
  }

  const groupedRecords = {};
  records.forEach((record) => {
    if (!groupedRecords[record.postcard]) {
      groupedRecords[record.postcard] = [];
    }
    record.friends.forEach((friend) => {
      groupedRecords[record.postcard].push({
        friend: friend,
        date: record.date,
      });
    });
  });

  const sortedPostcards = Object.keys(groupedRecords).sort();

  sortedPostcards.forEach((postcard) => {
    const row = tbody.insertRow();

    // Postcard name
    const postcardCell = row.insertCell(0);
    postcardCell.textContent = postcard;
    postcardCell.style.verticalAlign = "top";
    postcardCell.style.fontWeight = "500";

    // Friends and dates
    const friendsCell = row.insertCell(1);
    const friendDatePairs = groupedRecords[postcard]
      .map((item) => `【${item.friend}】 ${item.date}`)
      .join("\n");
    friendsCell.textContent = friendDatePairs;
    friendsCell.style.whiteSpace = "pre-line";
    friendsCell.style.lineHeight = "1.6";
  });
}
