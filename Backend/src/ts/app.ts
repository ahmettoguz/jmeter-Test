import { stat } from "fs";

const express = require("express");
const cp = require("child_process");
const multer = require("multer");
const fs = require("fs");

const app = express();
const port = 80;

// -------------------------------------------------- Middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Content-Type", "application/json");
  res.header("X-Content-Type-Options", "nosniff");
  next();
});
app.use(express.urlencoded({ extended: true }));

// multer file options
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./upload/"); // Dosyanın kaydedileceği klasör
  },
  filename: (req, file, cb) => {
    cb(null, "loadtest.jmx");
  },
});
const upload = multer({ storage: storage });

// -------------------------------------------------- Functions
function moveJmxFile(currentPath, targetPath) {
  fs.rename(currentPath, targetPath, function (err) {
    if (err) throw err;
  });
}

async function executeSh(shPath, shCommand, parameters) {
  return new Promise((resolve, reject) => {
    let output: string[] = [];
    const proc = cp.spawn(shCommand, parameters, {
      cwd: shPath,
      shell: "/bin/bash",
      env: process.env,
    });
    proc.stdout.on("data", (data) => {
      console.info(data.toString());
      output.push(data.toString());
    });
    proc.stderr.on("data", (data) => {
      console.error(data.toString());
    });
    proc.on("close", (code) => {
      if (code === 0) {
        console.info(`Child process closed with success code: ${code}`);
        resolve({ success: true, output });
      } else {
        console.error(`Child process closed with error code: ${code}`);
        reject({ success: false, output });
      }
    });
    proc.on("exit", (code) => {
      if (code !== 0) {
        console.error(`child process exited with non-zero code: ${code}`);
        reject({ success: false, output });
      }
    });
  });
}

async function runAllSteps(
  req,
  cloudProvider,
  plannedNodeCount,
  plannedPodCount,
  threadCount,
  duration
) {
  const shPath = `../Terraform/${cloudProvider}/script`;
  let result;
  let parameters;

  try {
    // execute prepare sh file params: node count, pod count
    // TODO hard coded node and pod count
    parameters = [
      "prepare.sh",
      plannedNodeCount,
      plannedPodCount,
      threadCount,
      duration,
    ];
    result = await executeSh(shPath, "sh", parameters);
    console.info("\nprepare.sh finished.");

    if (!result.success) {
      console.info("Process is Failed!");
      throw new Error("prepare.sh failed");
    }

    // execute upTerraform sh file
    parameters = ["upTerraform.sh"];
    result = await executeSh(shPath, "sh", parameters);
    console.info("\nupTerraform.sh finished.");

    if (!result.success) {
      console.info("Process is Failed!");
      throw new Error("upTerraform.sh failed");
    }

    // execute upCluster sh file
    parameters = ["upCluster.sh"];
    result = await executeSh(shPath, "sh", parameters);
    console.info("\nupCluster.sh finished.");

    if (!result.success) {
      console.info("Process is Failed!");
      throw new Error("upCluster.sh failed");
    }

    // execute sh runTest sh file
    parameters = ["runTest.sh"];
    result = await executeSh(shPath, "sh", parameters);
    console.info("\nrunTest.sh finished.");

    if (!result.success) {
      console.info("Process is Failed!");
      throw new Error("runTest.sh failed");
    }

    // execute result sh file
    parameters = ["result.sh"];
    result = await executeSh(shPath, "sh", parameters);
    console.info("\nresult.sh finished.");

    if (!result.success) {
      console.info("Process is Failed!");
      throw new Error("result.sh failed");
    }

    // execute down sh file
    parameters = ["downTerraform.sh"];
    result = await executeSh(shPath, "sh", parameters);
    console.info("\ndownTerraform.sh finished.");

    if (!result.success) {
      console.info("Process is Failed!");
      throw new Error("downTerraform.sh failed");
    }
  } catch (error: any) {
    console.error("Error:", error.message);
  }
}

// ------------------------------------------------- End Points
app.get("/", async (req, res) => {
  console.info(
    `---\nIncoming request to: ${req.url}\nMethod: ${req.method}\nIp: ${req.connection.remoteAddress}\n---\n`
  );

  return res.status(200).json({
    status: 200,
    state: true,
    message: "Service is up",
  });
});

app.post("/runTest", upload.single("jmxFile"), async (req, res) => {
  console.info(
    `---\nIncoming request to: ${req.url}\nMethod: ${req.method}\nIp: ${req.connection.remoteAddress}\n---\n`
  );

  const cloudProvider = req.body.cloudProvider;
  const virtualUser = req.body.virtualUser;
  const uploadedFile = req.file;

  const duration = 300;
  const threadCount = 200;
  const plannedPodCount = Math.ceil(virtualUser / threadCount);
  const plannedNodeCount = Math.ceil(plannedPodCount / 4);

  // check cloud provider
  if (
    cloudProvider != "DigitalOcean" &&
    cloudProvider != "Azure" &&
    cloudProvider != "AWS"
  )
    return res.status(400).json({
      status: 400,
      state: false,
      message: "Cloud provider is invalid!",
    });

  // check file
  if (uploadedFile == undefined) {
    return res.status(400).json({
      status: 400,
      state: false,
      message: "Jmx file is not provided!",
    });
  }

  // place jmx file to related path
  try {
    moveJmxFile(
      "./upload/loadtest.jmx",
      `../Terraform/${cloudProvider}/jmx_Config/loadtest.jmx`
    );
  } catch (error) {
    console.error("Cannot move file", error);
    return res.status(502).json({
      status: 502,
      state: false,
      message: "Cannot move file!",
    });
  }

  // start sh operations
  if (cloudProvider !== "AWS")
    runAllSteps(
      req,
      cloudProvider,
      plannedNodeCount,
      plannedPodCount,
      threadCount,
      duration
    );

  return res.status(200).json({
    status: 200,
    state: true,
    message: "Operations started.",
    data: [
      `Planned node count : ${plannedNodeCount}`,
      `Planned pod count : ${plannedPodCount}`,
      `Cloud Provider : ${cloudProvider}`,
    ],
  });
});

// ----------------------------------------------------------- Temp file operations
app.post("/temp", upload.single("jmxFile"), (req, res) => {
  console.info(
    `---\nIncoming request to: ${req.url}\nMethod: ${req.method}\nIp: ${req.connection.remoteAddress}\n---\n`
  );

  // check file
  const uploadedFile = req.file;
  if (uploadedFile == undefined) {
    return res.status(400).json({
      status: 400,
      state: false,
      message: "Jmx file is not provided!",
    });
  }

  const cloudProvider = req.body.cloudProvider;
  switch (cloudProvider) {
    case "DigitalOcean":
      break;

    case "Azure":
      // place jmx file to related path
      try {
        moveJmxFile(
          "./upload/loadtest.jmx",
          "../Terraform/Azure/jmx_Config/loadtest.jmx"
        );
      } catch (error) {
        console.error("Cannot move file", error);
        return res.status(502).json({
          status: 502,
          state: false,
          message: "Cannot move file!",
        });
      }
      break;

    default:
      return res.status(400).json({
        status: 400,
        state: false,
        message: "Cloud provider is invalid!",
      });
      break;
  }

  return res.status(200).json({
    status: 200,
    state: true,
    message: "Operations started with " + cloudProvider,
  });
});

app.listen(port, () => {
  console.log(`App is running on : http://localhost:${port}`);
});
