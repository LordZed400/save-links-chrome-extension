var categoryNames = [];

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
      categoryNames = sortedCategories;
      var categoryOptions = document.getElementById("linkCategory");
      categoryOptions.innerHTML = "";
      const fragmentDiv = document.createDocumentFragment();
      
      sortedCategories.forEach((category) => {
        var categoryOption = document.createElement("option");
        categoryOption.setAttribute("value", category)
        categoryOption.innerHTML = category;

        fragmentDiv.appendChild(categoryOption);

        var categoryItem = categoryTemplate.content.cloneNode(true);
        
        var categoryWrapper = categoryItem.querySelector(".category-container");
        categoryWrapper.id = category;
        var categoryHeader = categoryItem.querySelector(".category-header");
        var categoryEditButton = categoryItem.querySelector(".category-container .category-edit");
        var categoryTextElement = categoryItem.querySelector(".category-header .category-text");
        var categoryInputElement = categoryItem.querySelector(".category-header .category-input");

        categoryTextElement.textContent = category;
        categoryInputElement.value = category;

        categoryHeader.onclick = () => {
          const categoryHeaderParent = categoryHeader.closest(".category-container");
          if (!categoryHeaderParent.classList.contains("disabled")) {
            linksList.classList.toggle("collapsed");
          }
        };

        categoryEditButton.onclick = () => {
          if (categoryEditButton.dataset.state == "showing") {
            categoryEditButton.dataset.state = "editing";
            categoryEditButton.querySelector("img").src = "save.svg";
            categoryTextElement.classList.toggle("show");
            categoryInputElement.classList.toggle("show");
            categoryWrapper.classList.toggle("disabled");
          } else {
            const container = document.getElementById(category);
            const newName = container.querySelector(".category-title-input").value;
            
            if (category != newName) {
              if (categoryNames.includes(newName)) {
                return;
              }

              const updatedLinks = links.map((savedLink) => {
                if (savedLink.category == category) {
                  return {
                    ...savedLink,
                    category: newName,
                  };
                }
                return savedLink;
              });

              chrome.storage.sync
                .set({ savedLinksForLater: updatedLinks })
                .then(() => {
                  setLinks();
                });
            }
            categoryEditButton.dataset.state = "showing";
            categoryEditButton.querySelector("img").src = "edit.svg";
            categoryTextElement.classList.toggle("show");
            categoryInputElement.classList.toggle("show");
            categoryWrapper.classList.toggle("disabled");
          }
        };
        categoryInputElement.addEventListener("keydown", (e) => {
          if (e.key === "Enter") categoryEditButton.click();
        });

        const linksList = document.createElement("div");
        linksList.className = "links-list";

        grouped[category].forEach((link) => {
          var listItem = linkTemplate.content.cloneNode(true);
          listItem.querySelector(".single-link").id = link.id;

          var titleTextElement = listItem.querySelector(".link-title .link-title-text");
          var linkTextElement = listItem.querySelector(".link-url .link-url-text");

          var titleInputElement = listItem.querySelector(".link-title input");
          var linkInputElement = listItem.querySelector(".link-url input");
          
          var editButton = listItem.querySelector(".edit-button");
          var copyButton = listItem.querySelector(".copy-button");
          var deleteButton = listItem.querySelector(".delete-button");

          titleTextElement.textContent = link.title;
          linkTextElement.textContent = link.url;
          titleInputElement.value = link.title;
          linkInputElement.value = link.url;
          
          linkTextElement.onclick = () => {
            window.open(link.url, "_blank");
          };

          editButton.onclick = () => {
            if (editButton.dataset.state == "showing") {
              editButton.dataset.state = "editing";
              editButton.querySelector("img").src = "save.svg";
            } else {
              editButton.dataset.state = "showing";
              editButton.querySelector("img").src = "edit.svg";
              const container = document.getElementById(link.id);
              const newTitle = container.querySelector(".link-title input").value;
              const newUrl = container.querySelector(".link-url input").value;
              if (link.url != newUrl || link.title != newTitle) {
                const updatedLink = {
                  ...link,
                  title: newTitle,
                  url: newUrl,
                };
                
                const updatedLinks = links.map((savedLink) =>
                  savedLink.id === link.id ? updatedLink : savedLink
                );
  
                chrome.storage.sync
                  .set({ savedLinksForLater: updatedLinks })
                  .then(() => {
                    setLinks();
                  });
              }
            }
            titleTextElement.classList.toggle("show");
            linkTextElement.classList.toggle("show");
            titleInputElement.classList.toggle("show");
            linkInputElement.classList.toggle("show");
          };
          titleInputElement.addEventListener("keydown", (e) => {
            if (e.key === "Enter") editButton.click();
          });
          linkInputElement.addEventListener("keydown", (e) => {
            if (e.key === "Enter") editButton.click();
          });

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

      categoryOptions.appendChild(fragmentDiv);
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
