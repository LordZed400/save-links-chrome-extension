function setLinks() {
  var savedLinksContainer = document.getElementById("linksContainer");
  var categoryTemplate = document.getElementById("categoryTemplate");
  var linkTemplate = document.getElementById("linkTemplate");
  var noLinksMessage = "You haven't saved any links yet!!!";

  chrome.storage.sync.get(["savedLinksForLater"]).then((items) => {
    var links = items.savedLinksForLater || [];

    savedLinksContainer.innerHTML = "";

    if (links.length === 0) {
      var noLinksElement = document.createElement("div");
      noLinksElement.classList.add("no-links-message");
      noLinksElement.textContent = noLinksMessage;
      savedLinksContainer.appendChild(noLinksElement);
    } else {
      const grouped = {};
      links.forEach((link) => {
        if (!grouped[link.category]) {
          grouped[link.category] = [];
        }
        grouped[link.category].push(link);
      });

      const sortedCategories = Object.keys(grouped).sort();

      sortedCategories.forEach((category) => {
        var categoryItem = categoryTemplate.content.cloneNode(true);
        
        var categoryWrapper = categoryItem.querySelector(".category-container");
        var categoryTitle = categoryItem.querySelector(".category-title");
        var collapseHeader = categoryItem.querySelector(".category-header");

        categoryTitle.textContent = category;
        
        collapseHeader.onclick = () => {
          linksList.classList.toggle("collapsed");
        };
        
        const linksList = document.createElement("div");
        linksList.className = "links-list";
        grouped[category].forEach((link) => {
          var listItem = linkTemplate.content.cloneNode(true);

          var titleElement = listItem.querySelector(".link-title");
          var linkElement = listItem.querySelector(".link-url");
          var editButton = listItem.querySelector(".edit-button");
          var copyButton = listItem.querySelector(".copy-button");
          var deleteButton = listItem.querySelector(".delete-button");

          titleElement.textContent = link.title;
          linkElement.textContent = link.url;
          linkElement.onclick = () => window.open(link.url, "_blank");
          copyButton.onclick = () => {
            navigator.clipboard.writeText(link.url).then(() => {
              alert("Link copied to clipboard!");
            });
          };
          deleteButton.onclick = () => {
            var updatedLinks = links.filter(
              (savedLink) => savedLink.id !== link.id
            );
            chrome.storage.sync
              .set({ savedLinksForLater: updatedLinks })
              .then(() => {
                setLinks();
              });
          };

          linksList.appendChild(listItem);
        });

        categoryWrapper.appendChild(linksList);
        savedLinksContainer.appendChild(categoryWrapper);
      });
    }
  });
}

function saveLink() {
  var title = document.getElementById("linkTitle").value;
  var url = document.getElementById("linkUrl").value;
  var category = document.getElementById("linkCategory").value;
  var linkId = Date.now();

  chrome.storage.sync.get(["savedLinksForLater"]).then((items) => {
    var previousLinks = items.savedLinksForLater || [];
    var newLink = { id: linkId, title: title, url: url, category: category };
    previousLinks.push(newLink);
    chrome.storage.sync.set({ savedLinksForLater: previousLinks }).then(() => {
      setLinks();
    });
  });
}

function getCurrentTabInfo(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs.length === 0) return;
    const tab = tabs[0];
    const title = tab.title;
    const url = tab.url;

    callback({ title, url });
  });
}

var saveBtn = document.getElementById("saveButton");
saveBtn.addEventListener("click", saveLink);

var currentBtn = document.getElementById("currentButton");
currentBtn.addEventListener("click", () => {
  getCurrentTabInfo(({ title, url }) => {
    document.getElementById("linkTitle").value = title;
    document.getElementById("linkUrl").value = url;
  });
});

setLinks();
