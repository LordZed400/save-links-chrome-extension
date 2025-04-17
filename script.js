function setLinks() {
  var savedLinksContainer = document.getElementById("linksContainer");
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
      links.forEach((link) => {
        var listItem = linkTemplate.content.cloneNode(true);

        var titleElement = listItem.querySelector(".link-title");
        var linkElement = listItem.querySelector(".link-url");
        var editButton = listItem.querySelector(".edit-button button");
        var copyButton = listItem.querySelector(".copy-button button");
        var deleteButton = listItem.querySelector(".delete-button button");

        titleElement.textContent = link.category + " | " + link.title;
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

        savedLinksContainer.appendChild(listItem);
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

var saveBtn = document.getElementById("saveButton");
saveBtn.addEventListener("click", saveLink);

setLinks();
