const { get, max } = require("lodash");
const XLSX = require("xlsx");

const getHeaderDeep = (cs, deep = 0) => {
  return max(
    cs.map((c) => (c.children ? getHeaderDeep(c.children, deep + 1) : deep))
  );
};

const genHeaderCells = (columns = []) => {
  const flattenCs = [];
  const merges = [];
  const maxDeep = getHeaderDeep(columns);

  const genHeader = (
    cs = [], // columns
    row = 0, // row 迭代
    col = 0 // col 迭代
  ) => {
    let currentCol = col;
    let ret = {};
    let width = 0;

    cs.forEach((c) => {
      ret[XLSX.utils.encode_cell({ c: currentCol, r: row })] = {
        v: c.title,
        t: "s",
      };
      if (c.children) {
        // 如果有children 处理表头横向合并
        const { ret: childrenRet, widthRet } = genHeader(
          c.children,
          row + 1,
          currentCol
        );
        ret = { ...ret, ...childrenRet };
        merges.push({
          s: { r: row, c: currentCol },
          e: { r: row, c: currentCol + c.children.length + widthRet - 1 },
        });
        currentCol += c.children.length + widthRet;
        width++;
      } else {
        // 纵向合并
        if (maxDeep - row > 0) {
          merges.push({
            s: { c: currentCol, r: row },
            e: { c: currentCol, r: maxDeep },
          });
        }
        currentCol++;
        flattenCs.push(c);
      }
    });
    return { ret, widthRet: width };
  };

  const { ret: headerCells } = genHeader(columns);

  headerCells["!merges"] = merges;
  headerCells["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: maxDeep, c: flattenCs.length },
  });

  return {
    headerCells,
    flattenCs,
    maxDeep,
  };
};

function getJson(fileName, columns) {
  try {
    const wb = XLSX.readFile(fileName);

    /** grab first sheet */
    const wsname = wb.SheetNames[0];
    const ws = wb.Sheets[wsname];

    const { flattenCs, maxDeep } = genHeaderCells(columns);

    /** 把 columns key 对应到 excel 表格的表头 */
    const rows = XLSX.utils.sheet_to_json(ws, {
      header: flattenCs.map((c) => c.key || c.dataIndex), // flattenCs
      range: maxDeep + 1, // 跳过表头
    });

    return rows;
  } catch (error) {
    console.log("getJson", error);
    return [];
  }
}

module.exports = {
  getJson,
};
