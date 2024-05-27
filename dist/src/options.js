(() => {
  // build/util.js
  function cleanDomain(urls, exact = false) {
    if (urls[0] === void 0) {
      return "";
    } else {
      const activeURL = urls[0].match(exact ? /^[\w]+:\/{2}([^#?]+)/ : /^[\w]+:\/{2}([\w\.:-]+)/);
      if (activeURL == null) {
        return "";
      }
      return activeURL[1];
    }
  }
  function getElementFromForm(id) {
    return document.getElementById(id);
  }

  // build/storage.js
  var __awaiter = function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  function getStorage() {
    return __awaiter(this, void 0, void 0, function* () {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get(null, (storage2) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(storage2);
          }
        });
      });
    });
  }
  function setStorage(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(key, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }
  function addToBlocked(url, callback) {
    getStorage().then((storage2) => {
      if (!storage2.blockedSites.includes(url)) {
        storage2.blockedSites.push(url);
        setStorage({blockedSites: storage2.blockedSites}).then(() => {
          console.log(`${url} added to blocked sites`);
          callback ? callback() : () => {
          };
        });
      }
    });
  }

  // build/options.js
  var ENTER_KEY_CODE = 13;
  document.addEventListener("DOMContentLoaded", () => {
    drawFilterListTable();
    drawIntentListTable();
    setAddButtonListener();
    document.getElementById("linkToShortcuts").addEventListener("click", function() {
      chrome.tabs.create({url: "chrome://extensions/shortcuts"});
    });
    const slider = document.getElementById("thresholdSlider");
    const display = document.getElementById("thresholdSliderValue");
    const sliderToValue = (slider2) => `${Math.round(+slider2.value * 100)}%`;
    slider.oninput = () => {
      display.innerHTML = sliderToValue(slider);
    };
    getStorage().then((storage2) => {
      var _a, _b, _c, _d;
      getElementFromForm("whitelistTime").value = storage2.whitelistTime;
      getElementFromForm("numIntentEntries").value = storage2.numIntentEntries;
      getElementFromForm("minIntentLength").value = (_a = storage2.minIntentLength, _a !== null && _a !== void 0 ? _a : 3);
      getElementFromForm("customMessage").value = storage2.customMessage || "";
      getElementFromForm("enableBlobs").checked = (_b = storage2.enableBlobs, _b !== null && _b !== void 0 ? _b : true);
      getElementFromForm("enable3D").checked = (_c = storage2.enable3D, _c !== null && _c !== void 0 ? _c : true);
      getElementFromForm("checkIntent").checked = (_d = storage2.checkIntent, _d !== null && _d !== void 0 ? _d : true);
      getElementFromForm("thresholdSlider").value = storage2.predictionThreshold || 0.5;
      display.innerHTML = sliderToValue(slider);
    });
    document.getElementById("save").addEventListener("click", saveCurrentOptions);
  });
  function saveCurrentOptions() {
    const whitelistTime = getElementFromForm("whitelistTime").value;
    const numIntentEntries = getElementFromForm("numIntentEntries").value;
    const minIntentLength = getElementFromForm("minIntentLength").value;
    const customMessage = getElementFromForm("customMessage").value;
    const enableBlobs = getElementFromForm("enableBlobs").checked;
    const enable3D = getElementFromForm("enable3D").checked;
    const checkIntent = getElementFromForm("checkIntent").checked;
    const predictionThreshold = getElementFromForm("thresholdSlider").value;
    setStorage({
      numIntentEntries,
      whitelistTime,
      customMessage,
      enableBlobs,
      enable3D,
      checkIntent,
      predictionThreshold,
      minIntentLength
    }).then(() => {
      const status = document.getElementById("statusContent");
      status.textContent = "options saved.";
      setTimeout(() => {
        status.textContent = "";
      }, 1500);
    });
  }
  function updateButtonListeners() {
    const buttons = document.getElementsByTagName("button");
    for (const button of buttons) {
      button.addEventListener("click", () => {
        var _a;
        const id = parseInt(button.id[0]);
        const url = (_a = document.getElementById(button.id[0] + "site")) === null || _a === void 0 ? void 0 : _a.innerHTML;
        getStorage().then((storage2) => {
          const blockedSites = storage2.blockedSites;
          blockedSites.splice(id, 1);
          setStorage({blockedSites}).then(() => {
            console.log(`removed ${url} from blocked list`);
            drawFilterListTable();
          });
        });
      });
    }
  }
  function generateWebsiteDiv(id, site) {
    return `<tr>
    <td style="width: 95%"><p class="urlDisplay" id=${id}>${site}</p></td>
    <td style="width: 5%"><button id=${id}>&times;</button></td>
    </tr>`;
  }
  function generateIntentDiv(id, intent, date, url, accepted) {
    const formattedDate = date.toLocaleDateString("default", {
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true
    });
    return `<tr>
      <td style="width: 20%"><p class="intentDisplay" id=${id}>${url}</p></td>
      <td style="width: 40%"><p class="intentDisplay" id=${id}>${intent}</p></td>
      <td style="width: 15%"><p class="intentDisplay" id=${id}>${accepted}</p></td>
      <td style="width: 25%"><p class="intentDisplay" id=${id}>${formattedDate}</p></td>
    </tr>`;
  }
  function drawFilterListTable() {
    getStorage().then((storage2) => {
      const blockedSites = storage2.blockedSites;
      const tableContent = blockedSites.reduce((table2, site, cur_id) => {
        table2 += generateWebsiteDiv(cur_id, site);
        return table2;
      }, "");
      const table = `<table class="hover shadow styled">${tableContent}</table>`;
      const filterList = document.getElementById("filterList");
      if (filterList != null) {
        filterList.innerHTML = table;
      }
      updateButtonListeners();
    });
  }
  function drawIntentListTable() {
    getStorage().then((storage2) => {
      const intentList = storage2.intentList;
      let table = `<table id="intentList" class="hover shadow styled">
        <tr>
        <th id="urlHeader" style="width: 20%">url</th>
        <th style="width: 40%">intent</th>
        <th style="width: 15%">accepted?</th>
        <th style="width: 25%">date</th>
      </tr>`;
      let cur_id = 0;
      for (const rawDate in intentList) {
        if (cur_id < storage2.numIntentEntries) {
          const date = new Date(rawDate);
          const intent = intentList[rawDate].intent;
          const url = intentList[rawDate].url;
          const accepted = intentList[rawDate].accepted ? intentList[rawDate].accepted : "n/a";
          table += generateIntentDiv(cur_id, intent, date, url, accepted);
          cur_id++;
        }
      }
      table += "</table>";
      const previousIntents = document.getElementById("previousIntents");
      if (previousIntents != null) {
        previousIntents.innerHTML = table;
      }
    });
  }
  function setAddButtonListener() {
    const urlInputElement = document.getElementById("urlInput");
    urlInputElement.addEventListener("keypress", (event) => {
      if (event.keyCode === ENTER_KEY_CODE) {
        addUrlToFilterList();
      }
    });
    const addButton = document.getElementById("add");
    addButton.addEventListener("click", () => {
      addUrlToFilterList();
    });
  }
  function addUrlToFilterList() {
    const urlInput = document.getElementById("urlInput");
    if (urlInput.value !== "") {
      const url = urlInput.value;
      const cleanUrl = cleanDomain([url], true) === "" ? url : cleanDomain([url], true);
      addToBlocked(cleanUrl, () => {
        urlInput.value = "";
        drawFilterListTable();
      });
    }
  }
})();
//# sourceMappingURL=options.js.map
