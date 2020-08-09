/* SCRIPT TO BE ADDED TO A LIBREOFFICE DOC EXPORTED AS HTML TO CLEAN DOM & EXTRACT CONTENT AS JSON */

let getText = (node) => (node.innerText || node.textContent || node);
let normalize = (text) => {
  text = text.replace(/(^\s+|\s+$)/g,"");
  text = text.replace(/\s{2,}/g," ");
  return text;
};
let findAuthor = (element) => {
  let author = element.parentElement.lastChild;
  if (author == element) {
    author = element.parentElement.nextSibling;
  }
  try {
    author = getText(author);
  } catch {
    console.log(author);
  }
  return author;
};
let parseAuthor = (text) => {
  let separator = ["&"," et ","\n"].find(e => text.indexOf(e) >= 0);
  text = text.split(separator).map(authorName => {
    authorName = normalize(authorName);
    if (authorName.slice(0,3) == "de ") {
      authorName = authorName.slice(3);
    }
    return authorName;
  });
  return text;
};
let findCompleteTextNode = (element,selector,text=[]) => {
  text.push(element);
  if ((element.nextSibling) && (element.nextSibling.nodeName == selector)) {
    return findCompleteTextNode(element.nextSibling,selector,text);
  } else {
    return normalize(text.map(e => getText(e)).join(""));
  }
};
let findSummary = (element) => {
  let nextSibling = element.nextElementSibling;
  if (nextSibling === null) {
    return findSummary(element.parentElement);
  } else {
    let summary = nextSibling.querySelector("i");
    if (summary === null) {
      return findSummary(element.parentElement);
    } else {
      return summary;
    }
  }
}
let completeSummary = (element,summary=[]) => {
  try {
    if (element.nextElementSibling.querySelector("i") == null) {
      return summary;
    } else {
      summary.push(normalize(getText(element.nextElementSibling.querySelector("i"))));
      return completeSummary(element.nextElementSibling,summary);
    }
  } catch {
    return summary;
  }
}
let extractTags = (node,tags={}) => {
  //facultatif: h2
  //obligatoire: h1
  if (node.previousSibling.nodeName == "H1") {
    tags.h1 = normalize(getText(node.previousSibling));
    return tags;
  } else if (node.previousSibling.nodeName == "H2") {
    if (typeof tags.h2 == "undefined") {
      tags.h2 = normalize(getText(node.previousSibling));
    }
    return extractTags(node.previousSibling,tags);
  } else {
    return extractTags(node.previousSibling,tags);
  }
}
let extractContent = () => {
  let titles = [...document.querySelectorAll("u:first-child")];
  titles = titles.map(titleNode => {
    let titre = findCompleteTextNode(titleNode,"U");
    let resume = [];
    let tags = {};
    resume = completeSummary(titleNode.parentElement).join("\n");
    if ((resume == "") || (resume == "\n")) {
      console.error("failed finding summary on title "+titre);
    }
    let auteurs = parseAuthor(findAuthor(titleNode));
    if (auteurs[0] == titre) {
      console.error("failed finding author on title "+titre);
    }
    tags = extractTags(titleNode.parentElement);
    if (tags === {}) {
      console.error("failed finding tags on title "+titre);
    }
    return {
      titre,
      resume,
      auteurs,
      tags
    }
  });
  return titles;
};
let cleanDoc = () => {
  let newDoc = document.body.cloneNode();
  let topLevel = [...document.querySelector("body").children];
  topLevel.filter(e => e.nodeName !== "SCRIPT").map(node => {
    let nodeName = node.nodeName;
    if ((node.querySelector("i") === null)
      && (node.querySelector("u") === null)) {
        if (normalize(getText(node)) !== "") {
          let newElem = document.createElement(nodeName);
          newElem.innerText = normalize(getText(node));
          newDoc.append(newElem);
        }
    } else {
      ["i","u"].map(e => {
        let elements = [...node.querySelectorAll(e)];
        let styledText = "";
        let unstyledText = "";
        if (elements.length > 0) {
          styledText = normalize(elements.map(e => getText(e)).join(""));
          unstyledText = normalize(getText(node)).slice(styledText.length);
          let p = document.createElement("p");
          if ((styledText != "") && (styledText != '”')) {
            let newElem = document.createElement(e);
            newElem.innerText = styledText;
            p.append(newElem);
          }
          if ((unstyledText != "") && (unstyledText != '”')) {
            let textNode = document.createTextNode(unstyledText);
            p.append(textNode);
          }
          if (normalize(getText(p)) != "") {
            newDoc.append(p);
          }
        }
      })
    }
  });
  document.body.innerHTML = newDoc.innerHTML;
}
cleanDoc();
data = extractContent();
ean = {
  "Un tigre dans mon jardin":"9782919181025",
  "Panic city":"9782919181063",
  "Trafic Ocean":"9782919181032",
  "Un tout petit point":"9782919181087"
}
Object.keys(ean).map(e => {
  data.find(d => d.titre == e).ean = ean[e];
});
document.body.innerHTML = JSON.stringify(data);
//console.log(extractContent());
