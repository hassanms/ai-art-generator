const fs = require("fs");
const path = require("path");
const Buffer = require("buffer").Buffer;
const { converBase64ToImage } = require("convert-base64-to-image");
const sharp = require("sharp");


// console.log(apikeys);

const engineId = "stable-diffusion-v1-5";
const apiHost = "https://api.stability.ai";
let apiKey = "sk-kS1IaIpNbn8Ou6q7nHoOfqllMLM5FxcUxPKsTGLut8P7vzKa";
// let apiKey = 'sk-PXVyDAnN868qT2b2UryQptY10WKMLh8nAsZ8fjEOMnFGdiX6';

if (!apiKey) throw new Error("Missing Stability API key.");
let abortController = new AbortController();
let signal = abortController.signal;


// if (abortController.current) {
//   abortController.abort()
// }
// Assign a new AbortController for the latest fetch to our useRef variable
// abortController.current = new AbortController()
// const { signal } = abortController.current

async function generateImage( imagePath) {
  const base64Regex = /^data:image\/(png|jpeg|jpg);base64,/;
  if (base64Regex.test(lastImageFromApi)) {
    const initImageFile = new File(
      [await fetch(imagePath).then((response) => response.blob())],
      "init_image.png",
      { type: "image/png" }
    );
  }
  const initImageFile = new File(
    [await fetch(imagePath).then((response) => response.blob())],
    "init_image.png",
    { type: "image/png" }
  );

  
  const formData = new FormData();
  formData.append("init_image", initImageFile);
  formData.append("init_image_mode", "IMAGE_STRENGTH");
  formData.append("image_strength", 0.35);
  formData.append("text_prompts[0][text]", " ");
  formData.append("cfg_scale", 7);
  formData.append("clip_guidance_preset", "FAST_BLUE");
  formData.append("samples", 1);
  formData.append("steps", 30);
  

  const response = await fetch(
    `https://api.stability.ai/v1/generation/stable-diffusion-v1-5/image-to-image`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
      signal,
    }
  );

  if (!response.ok) {
    throw new Error(`Non-200 response: ${await response.text()}`);
  }

  const responseJSON = await response.json();
  
  const artifacts = responseJSON.artifacts.map((artifact) => ({
    src: `data:image/png;base64,${artifact.base64}`,
    seed: artifact.seed,
    finishReason: artifact.finishReason,
  }));
  console.log(artifacts[0].src);
  return artifacts;
}

let images = [];
let currentImageIndex = 0;
let lastImageFromApi = null;
let checked = true;
const getNextImage = () => {
  const imagePath = images[currentImageIndex];
 
  // if (currentImageIndex === 0) {
  //   currentImageIndex++;
  // }
  if (imagePath === undefined) {
    // alert("Images Not Found");
    errorss.innerHTML = "Images Not Found";
      errorss.classList.add("show_errrors");
      startButton.textContent = "Start";
      generte_image.classList.remove("show");

      setTimeout(function () {
        errorss.classList.remove("show_errrors");
      }, 2000);
  }
  return imagePath;
};

const loops = async () => {
  // lastImageFromApi = null;
  while (checked) {
    // loader.classList.add("display");
    const base64Regex = /^data:image\/(png|jpeg|jpg);base64,/;
    if (base64Regex.test(lastImageFromApi)) {
      // const next = getNextImage();
      // console.log(next);
      const nextImage = lastImageFromApi ? lastImageFromApi : getNextImage();
      // const nextImage = lastImageFromApi;

      const artifacts = await generateImage( nextImage);
      displayImage(artifacts[0]);
      lastImageFromApi = artifacts[0].src;
      // loader.classList.remove("display");
    } else {
      // const next = getNextImage();
      // console.log(next);
      const nextImage = getNextImage();
      
      const outputBuffer = await sharp(nextImage).resize(512, 512).toBuffer();
    
      const buffer = Buffer.from(outputBuffer);
      const base64String = buffer.toString("base64");
      const finalImage = `data:image/png;base64,${base64String}`;
      const artifacts = await generateImage( finalImage);
      displayImage(artifacts[0]);
      lastImageFromApi = artifacts[0].src;
      // loader.classList.remove("display");
    }
  }
};

const printImage = () => {
  const currentImage = imageContainer.querySelector("img");
  if (!currentImage) {
    // alert("No image to print.");
    errorss.innerHTML = "No image to print";
    errorss.classList.add("show_errrors");
    startButton.textContent = "Start";
    setTimeout(function () {
      errorss.classList.remove("show_errrors");
    }, 2000);
    
    return;
  }
  const imgWindow = window.open("", "Print");
  imgWindow.document.write(
    '<html><head><title>Print</title></head><body><img src="' +
      currentImage.src +
      '"/></body></html>'
  );
  imgWindow.document.close();
  imgWindow.focus();
  imgWindow.print();
  imgWindow.close();
};

const startButton = document.getElementById("start-button");
const printButton = document.getElementById("print-button");
const nextButton = document.getElementById("next-button");
const clearButton = document.getElementById("clear-button");
const apikeys = document.getElementById("apikey");
const apibtn = document.getElementById("apibtn");
let imageFolderInput = document.getElementById("image-folder");
// let promptInput = document.getElementById("prompt");
const imageContainer = document.getElementById("image-container");
const loader = document.querySelector("#loading");
const generte_image = document.getElementById("generte_image");
const errorss = document.getElementById("errors");

clearButton.addEventListener("click", () => {
  console.log(currentImageIndex);
  startButton.textContent = "Start";
  images = "";
  generte_image.classList.remove("show");
  loader.classList.remove("display");
  currentImageIndex = 0;
  imageFolderInput.value = "";
  // promptInput.value = "";
  lastImageFromApi = null;
  imageContainer.innerHTML = "";
  abortController.abort();
  abortController = new AbortController();
  signal = abortController.signal;
  startButton.textContent = "Start";
  
});

// apibtn.addEventListener("click", () => {
//   console.log(apiKey);
//   const data = apikeys.value;
//   apiKey = data;
//   console.log(apiKey);
// });
nextButton.addEventListener("click", async () => {
  loader.classList.remove("display");
  generte_image.classList.remove("show");
 
  
  // checked = false;
  currentImageIndex++;
  lastImageFromApi = null;
  abortController.abort();
  abortController = new AbortController();
  signal = abortController.signal;
  const imagePath = images[currentImageIndex];
  if(imagePath){
    generte_image.classList.add("show");
    startButton.textContent = "Stop"

  }
  if(images !== ""){

    const outputBuffer = await sharp(imagePath).resize(512, 512).toBuffer();
      
        const buffer = Buffer.from(outputBuffer);
        const base64String = buffer.toString("base64");
        const finalImage = `data:image/png;base64,${base64String}`;
    const artifacts = await generateImage( finalImage);
  
    
  
    displayImage(artifacts[0]);
    lastImageFromApi = artifacts[0].src;
    // loader.classList.remove("display");
  
    loops();
  }
 

  if (currentImageIndex === undefined) {
    currentImageIndex = 0;
    console.log(currentImageIndex);
  }
});
startButton.addEventListener("click", async () => {
  let check = startButton.textContent;
  const imageFolder = imageFolderInput.value;
  // const prompt = promptInput.value;
  if (check === "Start") {
    
    checked = true;
    startButton.textContent = "Stop";
    loader.classList.add("display");
    generte_image.classList.add("show");

    if (!imageFolder) {

    startButton.textContent = "Start";
    loader.classList.remove("display");
    generte_image.classList.remove("show");
      errorss.innerHTML = "Please fill the field";
      errorss.classList.add("show_errrors");
      setTimeout(function () {
        errorss.classList.remove("show_errrors");
      }, 2000);
      return;
    }
 
    
    const imagePath = images[currentImageIndex];
    if (imagePath === undefined) {
      // startButton.textContent = "Start";
      // loader.classList.remove("display");
      // generte_image.classList.remove("show");
    } else {
      startButton.textContent = "Stop";
      loader.classList.add("display");
      generte_image.classList.add("show");
    }

    if (images.length === 0) {
      fs.readdir(imageFolder, async (err, files) => {
        if (err) {
          // alert("Could not read the image folder.");
          errorss.innerHTML = "Could not read the image folder.";
          errorss.classList.add("show_errrors");
          setTimeout(function () {
            errorss.classList.remove("show_errrors");
          }, 2000);
          return;
        }
        // startButton.textContent = "Start";

        images = files
          .filter(
            (file) =>
              file.endsWith(".jpg") ||
              file.endsWith(".jpeg") ||
              file.endsWith(".png")
          )
          .map((file) => path.join(imageFolder, file));
     

        if (images.length === 0) {
          alert("No more images found in the image folder.");
          return;
        }
        const firstImage = getNextImage();
        const artifacts = await generateImage( firstImage);

        

        displayImage(artifacts[0]);
        lastImageFromApi = artifacts[0].src;
        // loader.classList.remove("display");

        loops();
      });
    } else {
      loops();
    }
  } else if (check === "Stop") {
    
    startButton.textContent = "Start";
    loader.classList.remove("display");
    abortController.abort();
    abortController = new AbortController();
    signal = abortController.signal;
    generte_image.classList.remove("show");
    // checked = false;
  }
 
});

printButton.addEventListener("click", () => {
  printImage();
});

const displayImage = (imagePath) => {
  imageContainer.innerHTML = "";
  const img = document.createElement("img");
  img.src = imagePath.src;
  img.id = "image";
  imageContainer.appendChild(img);
};
const setting = document.getElementById("setting");
const close = document.getElementById("close");
const show = document.getElementById("show");
setting.addEventListener("click", () => {
  show.classList = "display";
});

close.addEventListener("click", () => {
  show.classList = "sidesetting";
  console.log(apiKey);
});
