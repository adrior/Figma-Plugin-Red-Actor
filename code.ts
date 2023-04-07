// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { themeColors: true, width: 400, height: 600 });

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.

figma.ui.onmessage = (msg) => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  // if (msg.type === "create-rectangles") {
  //   const nodes: SceneNode[] = [];
  //   for (let i = 0; i < msg.count; i++) {
  //     const rect = figma.createRectangle();
  //     rect.x = i * 150;
  //     rect.fills = [{ type: "SOLID", color: { r: 1, g: 0.5, b: 0 } }];
  //     figma.currentPage.appendChild(rect);
  //     nodes.push(rect);
  //   }
  //   figma.currentPage.selection = nodes;
  //   figma.viewport.scrollAndZoomIntoView(nodes);
  // }

  function findTexts() {
    let nodes = figma.currentPage.findAllWithCriteria({ types: ["TEXT"] });
    let texts = nodes
      .map((textLayer) => {
        return {
          key: textLayer.name,
          content: textLayer.characters,
        };
      })
      .filter((el) => /^(([a-z0-9\-]+\.)+([a-z0-9\-]+))$/gm.test(el.key));
    figma.ui.postMessage({ type: "text-received", content: texts });
    // figma.currentPage.selection = nodes;
    // figma.viewport.scrollAndZoomIntoView(nodes);
  }

  if (msg.type === "find-texts") {
    findTexts();
  }

  if (msg.type === "cancel") {
    figma.closePlugin();
  }
  if (msg.type === "resize") {
    const w = 240;
    figma.ui.resize(w, msg.h);
    figma.ui.reposition(msg.w, 0);
  }

  if (msg.type === "find-on-page") {
    let nodes = figma.currentPage.findAll(
      (n) =>
        n.type === "TEXT" && n.name === msg.key && n.characters === msg.content
    );
    figma.currentPage.selection = nodes;
    figma.viewport.scrollAndZoomIntoView(nodes);
  }

  if (msg.type === "replace-other") {
    console.log(msg);
    let nodes = figma.currentPage.findAll(
      (n) =>
        n.type === "TEXT" && n.name === msg.key && n.characters !== msg.content
    );
    nodes.forEach((n) => {
      n.characters = msg.content;
    });

    findTexts();
    figma.currentPage.selection = nodes;
    figma.viewport.scrollAndZoomIntoView(nodes);
  }

  async function loadFonts() {
    let nodes = figma.currentPage.findAllWithCriteria({ types: ["TEXT"] });
    nodes.forEach(async (node) => {
      await Promise.all(
        node
          .getRangeAllFontNames(0, node.characters.length)
          .map(figma.loadFontAsync)
      );
    });
  }

  loadFonts();

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  // figma.closePlugin();
};
