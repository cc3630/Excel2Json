const { getJson } = require("./lib");
const { columns } = require("./column");
const fs = require("fs");
const path = require("path");

const argv = process.argv;
if (argv.length <= 2) {
  console.log("请指定待处理的文件路径");
  return;
}

if (columns.length < 1) {
  console.log("请输入适当的列信息");
  return;
}
const fileName = argv[2];
const rows = getJson(fileName, columns);

if (rows.length < 1) {
  console.log("未读取到数据");
  return;
}

let file = path.resolve(__dirname, "./result.json");
// 异步写入数据到文件
fs.writeFile(file, JSON.stringify(rows), { encoding: "utf8" }, (err) => {
  if (err) {
    console.log("写入文件失败", err);
  }
});

console.log("转换完成");
