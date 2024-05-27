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

  // build/popup.js
  document.addEventListener("DOMContentLoaded", () => {
    const toggleSwitch = document.querySelector("#reflect-toggle");
    toggleSwitch.addEventListener("change", toggleState, false);
    getStorage().then((storage2) => {
      toggleSwitch.checked = storage2.isEnabled;
      setupBlockListener(storage2.blockedSites);
    });
  });
  function toggleState(e) {
    const port = chrome.runtime.connect({
      name: "toggleState"
    });
    port.postMessage({state: e.target.checked});
    port.disconnect();
  }
  function updateButton(unblock) {
    document.getElementById("block").innerHTML = unblock ? "block page." : "unblock page.";
    document.getElementById("block").style.borderRadius = unblock ? "5px 0 0 5px" : "5px";
    document.getElementById("dropdown").style.display = unblock ? "block" : "none";
  }
  function setupBlockListener(blockedSites) {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const urls = tabs.map((x) => x.url);
      const domain = cleanDomain(urls);
      const url = cleanDomain(urls, true);
      if (domain === "") {
        document.getElementById("curDomain").textContent = "none.";
        return;
      }
      document.getElementById("curDomain").textContent = domain;
      let exact = false;
      if (blockedSites.includes(domain)) {
        updateButton(false);
      } else if (blockedSites.includes(url)) {
        updateButton(false);
        exact = true;
      }
      document.getElementById("block").addEventListener("click", () => {
        const port = chrome.runtime.connect({
          name: "blockFromPopup"
        });
        const buttonText = document.getElementById("block").innerHTML;
        if (buttonText === "block page.") {
          port.postMessage({unblock: false, siteURL: domain});
          updateButton(false);
        } else {
          port.postMessage({unblock: true, siteURL: exact ? url : domain});
          updateButton(true);
        }
        port.disconnect();
      });
      document.getElementById("blockPath").addEventListener("click", () => {
        const port = chrome.runtime.connect({
          name: "blockFromPopup"
        });
        const buttonText = document.getElementById("block").innerHTML;
        if (buttonText === "block page.") {
          port.postMessage({unblock: false, siteURL: url});
          updateButton(false);
        }
        port.disconnect();
      });
      document.getElementById("blockPath").style.display = "none";
      document.getElementById("dropdown").addEventListener("click", () => {
        const dropdown = document.getElementById("blockPath");
        dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
      });
      window.onclick = function(event) {
        const target = event.target;
        if (!target.matches("#dropdown")) {
          const dropdown = document.getElementById("blockPath");
          dropdown.style.display = "none";
        }
      };
    });
  }
})();
//# sourceMappingURL=popup.js.map
