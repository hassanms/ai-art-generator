const fs = require("fs");
const path = require("path");
const Buffer = require("buffer").Buffer;
const { converBase64ToImage } = require("convert-base64-to-image");
const sharp = require("sharp");
const sizeOf = require("image-size");
const puppeteer = require("puppeteer");
const Store = require('electron-store');
const { ipcRenderer } = require('electron');





const engineId = "stable-diffusion-v1-5";
const apiHost = "https://api.stability.ai";
// let apiKey = "sk-R6qFH1iNMDyImt5xcpGplSWCTfDBTecBJpTlczd4gjEc8Ji6";
let apiKey ;

// ipcRenderer.send('update-api-key', apiKey);

// Request the current API key
ipcRenderer.send('get-api-key');

// Listen for the reply containing the current API key
ipcRenderer.on('get-api-key-reply', (event, apiKeys) => {
  apiKey = apiKeys
  console.log('Current API key:', apiKey);
});


// if (!apiKey) throw new Error("Missing Stability API key.");
let abortController = new AbortController();
let signal = abortController.signal;


// if (abortController.current) {
//   abortController.abort()
// }
// Assign a new AbortController for the latest fetch to our useRef variable
// abortController.current = new AbortController()
// const { signal } = abortController.current
const toastMessage = (message)=>{
  errorss.innerHTML = message;
  errorss.classList.add("show_errrors");
  setTimeout(function () {
    errorss.classList.remove("show_errrors");
  }, 2000);

}
async function generateImage( imagePath) {
  console.log(apiKey);
  const base64Regex = /^data:image\/(png|jpeg|jpg);base64,/;
  let imageBuffer;

  if (base64Regex.test(imagePath)) {
    // If the input is already in base64 format, convert it to a buffer
    const base64Data = imagePath.replace(base64Regex, "");
    imageBuffer = Buffer.from(base64Data, "base64");
  } else {
    // If the input is an image file path, resize it to meet the pixel count limit
    const { width, height } = sizeOf(imagePath);
    const maxPixelCount = 1048576; // 1024 * 1024 = 1,048,576
    const currentPixelCount = width * height;

    // Calculate the scale to fit the image within the pixel count limit
    const scale = Math.sqrt(maxPixelCount / currentPixelCount);
    const targetWidth = Math.floor(width * scale);
    const targetHeight = Math.floor(height * scale);

    // Set maximum width and height to comply with pixel count limit
    const maxWidth = 512;
    const maxHeight = 512;
    const finalWidth = Math.min(targetWidth, maxWidth);
    const finalHeight = Math.min(targetHeight, maxHeight);

    const outputBuffer = await sharp(imagePath)
      .resize(finalWidth, finalHeight)
      .toBuffer();
    imageBuffer = Buffer.from(outputBuffer);
  }

  const initImageFile = new File([imageBuffer], "init_image.png", { type: "image/png" });


  
  const formData = new FormData();
  formData.append("init_image", initImageFile);
  formData.append("init_image_mode", "IMAGE_STRENGTH");
  formData.append("image_strength", 0.35);
  formData.append("text_prompts[0][text]", " ");
  formData.append("cfg_scale", 7);
  formData.append("clip_guidance_preset", "FAST_BLUE");
  formData.append("samples", 1);
  formData.append("steps", 30);
  
  // let getApiKey = store.get('apiKey');
  // console.log(getApiKey);
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
      toastMessage("Images Not Found")
      startButton.textContent = "Start";
      generte_image.classList.remove("show");
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
    toastMessage('No image to print')
    startButton.textContent = "Start";
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
// side bar buttons
const startbtn = document.getElementById("startbtn");
const generatebtn = document.getElementById("generatebtn");
const inputApiKeys = document.getElementById("apikey");

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
  if(images !== "" || !imagePath){

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
  console.log("sadfa");
  let check = startButton.textContent;
  const imageFolder = imageFolderInput.value;
  // const prompt = promptInput.value;


  if (startButton.innerText === "Start") {

    
    checked = true;
    startButton.textContent = "Stop";
    loader.classList.add("display");
    generte_image.classList.add("show");

    if (!imageFolder) {

    startButton.textContent = "Start";
    loader.classList.remove("display");
    generte_image.classList.remove("show");
      errorss.innerHTML = "Please Fill the Field";
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

// start Button in Setting
startbtn.addEventListener("click", () => {
  if(!inputApiKeys.value){
    errorss.innerHTML = "First Generte Api Key";
      errorss.classList.add("show_errrors");
      setTimeout(function () {
        errorss.classList.remove("show_errrors");
      }, 2000);
  }
  console.log(inputApiKeys.value);
  ipcRenderer.send('update-api-key', inputApiKeys.value);
});

// generate Button in Setting
generatebtn.addEventListener("click",()=>{
  runPuppeteer()
})

// Setting
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

// Get Api Key 
async function runPuppeteer() {
  try {
    // Launch the browser with the new Headless mode
    const browser = await puppeteer.launch({
      headless: false,
    });

    // Create a new page
    const page = await browser.newPage();
    // Navigate to a website
    await page.goto("https://internxt.com/temporary-email");
    await page.waitForTimeout(4000);



    // Get email Placeholder
    const search = await page.waitForSelector("body > div > div > section > div > div > div > div > div > p " ,{timeout : 60000});
    let internxtEmail;
    let apiKeyText;
    // if (search) {
      // If the element is found, extract its inner text
      internxtEmail = await page.evaluate(
        (element) => element.innerHTML,
        search
      );
      console.log(internxtEmail);
      const dreamStudio = await browser.newPage();
      await dreamStudio.goto("https://dreamstudio.ai");
      // await dreamStudio.waitForNavigation({ waitUntil: "domcontentloaded" });

      //   Get Started Button
      const getStartedBtn = await dreamStudio.waitForSelector(
        "body > div > div > div > div > div > div > div > div > div > a"
      );
      // if (getStartedBtn) {
        await dreamStudio.waitForTimeout(4000);
        await getStartedBtn.click();
        await dreamStudio.waitForTimeout(10000);
        // Check popover and click remove button
        const popOverRemoveBtn = await dreamStudio.waitForSelector(
          'body > div > div > div > div > div > button > svg'
        );
        // if (popOverRemoveBtn) {
          // await dreamStudio.waitForTimeout(5000);
          // await dreamStudio.waitForTimeout(20000);

          await utilityBtnFun(dreamStudio, popOverRemoveBtn,3000);
          // Click Checkbox
          const checkBox = await dreamStudio.waitForSelector("body > div > div > div > div > div");
          // if (checkBox) {
            await utilityBtnFun(dreamStudio, checkBox ,3000);

            // Accept Button
            const acceptBtn = await dreamStudio.waitForSelector("body > div > div > div > div > div > button");
            // if (acceptBtn) {
              await dreamStudio.waitForTimeout(2000);
              await utilityBtnFun(dreamStudio, acceptBtn ,4000);

              // Click Login Button
              const loginBtn = await dreamStudio.waitForSelector("body > div > div > nav > div > button");
              // if (loginBtn) {
                await utilityBtnFun(dreamStudio, loginBtn ,4000);

                // Click Sign up Buttony
                const signuoBtn = await dreamStudio.waitForSelector('p.c74028152 > a');
                // if(signuoBtn){
                  await dreamStudio.waitForTimeout(4000);

                  await utilityBtnFun(dreamStudio, signuoBtn ,2000);

                    // Enter Email
                    const email = await dreamStudio.waitForSelector('body > div > main > section > div > div > div > form > div > div > div > div > div > input ');
                    // if(email){
                        await email.type(internxtEmail)
                        await dreamStudio.waitForTimeout(1000);
                        // Enter Password
                        // const password = await dreamStudio.$('body > div > main > section > div > div > div > form > div > input ')
                        const password = await dreamStudio.waitForSelector('input[name="password"]');
                        // if(password){
                        //   // const innerTextss = await password.evaluate(element => element);
                        //   // console.log("fgdsf dsfg");
                          await password.type(generateRandomPassword())

                        // Submit
                        const submitButton = await dreamStudio.waitForSelector('button[type="submit"]');
                        await submitButton.click();
                        await dreamStudio.waitForTimeout(2000);

                      // Second Checkbox
                      const secondCheckBox = await dreamStudio.waitForSelector("body > div > div > div > div > div");
                      await utilityBtnFun(dreamStudio, secondCheckBox ,2000);

                      // Second Accept Button
                      const secondAcceptBtn = await dreamStudio.waitForSelector("body > div > div > div > div > div > button");
                        await dreamStudio.waitForTimeout(2000);
                        await utilityBtnFun(dreamStudio, secondAcceptBtn ,2000);


                      // Create a new page
                      const page2 = await browser.newPage();
                      // Navigate to a website
                      await page2.goto("https://internxt.com/temporary-email");
                      await page2.waitForTimeout(4000);  
                      
                      //Refreash Button
                      const refreshBtn = await page2.waitForSelector("body > div > div > section > div > div > div > div > div > svg");
                      await utilityBtnFun(page2, refreshBtn, 3000); 
                      // Inbox Button
                      const inboxBtn = await page2.waitForSelector('body > div > div > section > div > div > div > div > div > button');
                      await utilityBtnFun(page2, inboxBtn, 5000); 

                      // Click Anchor Tag
                      const anchorElement = await page2.waitForSelector('div.main > p > a');
                      await utilityBtnFun(page2, anchorElement, 2000); 

                      // Create a new page
                      const page3 = await browser.newPage();
                      // Navigate to a website
                      await page3.goto("https://dreamstudio.ai/generate");
                      await page3.waitForTimeout(4000);  
                      
                      //checkbox 3
                      const checkBox3 = await page3.waitForSelector("body > div > div > div > div > div");
                      await utilityBtnFun(page3, checkBox3, 2000); 

                      //accept button 3
                      const acceptBtn3 = await page3.waitForSelector("body > div > div > div > div > div > button");
                      await utilityBtnFun(page3, acceptBtn3, 4000); 

                      // Click Login Button
                      const loginBtn2 = await page3.waitForSelector("body > div > div > nav > div > button");
                      await utilityBtnFun(page3, loginBtn2 ,4000);

                      // Accept Button 3
                      const acceptBtn4 = await page3.waitForSelector("button.c9f67a967");
                      await utilityBtnFun(page3, acceptBtn4, 4000);

                       //checkbox 4
                       const checkBox4 = await page3.waitForSelector("body > div > div > div > div > div");
                       await utilityBtnFun(page3, checkBox4, 2000); 
 
                       //accept button 5
                       const acceptBtn5 = await page3.waitForSelector("body > div > div > div > div > div > button");
                       await utilityBtnFun(page3, acceptBtn5, 4000); 

                      // Person Icon
                      const personIcon = await page3.waitForSelector("div.ml-1 > div > svg");
                      await utilityBtnFun(page3, personIcon, 4000);

                      // show api key
                      const eysBtn = await page3.waitForSelector("body > div > div > div > div > div > div > div > div > div > div > div > div.justify-end > button")
                      await utilityBtnFun(page3, eysBtn, 4000);

                      // Confirm Button
                      const confirmBtn = await page3.waitForSelector("div > div > div > button.shadow-brand-500-md");
                      await utilityBtnFun(page3, confirmBtn, 4000);
                      
                      // copy api key
                      const apiKeyBtn = await page3.waitForSelector("div.rounded > div > div > div > div.truncate");
                      apiKeyText = await page3.evaluate(
                        (element) => element.innerText,
                        apiKeyBtn
                      );

                      console.log(apiKeyText);
                      inputApiKeys.value = apiKeyText  
                      await page3.waitForTimeout(5000);
                      await page3.close();
                      
    // Close the browser instance
    await browser.close();
  } catch (error) {
    console.error("Error occurred:", error);
    await browser.close();

  }
}

// Generate Random Password
function generateRandomPassword() {
  const uppercaseLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercaseLetters = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const specialCharacters = "!@#$%^&*()-_=+[]{}|;:,.<>?"

  const allCharacters =
    uppercaseLetters + lowercaseLetters + numbers + specialCharacters;

  let password = "";

  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * allCharacters.length);
    password += allCharacters.charAt(randomIndex);
  }

  return password;
}

// setIntervel
async function helperFun(confirmation,data){
  const timeInterval =  setInterval(async()=>{
    if(!confirmation){
      clearInterval(timeInterval)
    }else{
      await data
    }
  },1000)
}

// Utility Functions
async function utilityBtnFun(dreamStudio, btnName,time){
  if(btnName){
    await btnName.click();
    await dreamStudio.waitForTimeout(time);
  }else{
    utilityBtnFun(dreamStudio,btnName,time)
  }
}