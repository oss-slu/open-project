import React from "react";
import { Util } from "tabler-react-2";
import { Badge } from "tabler-react-2";
import { Icon } from "#icon";
import style from "./ObjectDiffViewer.module.css";

const convertCamelToSentenceCase = (str) => {
  return str
    .replace(/\./g, " ") // Replace periods with spaces
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .replace(/^./, function (str) {
      return str.toUpperCase(); // Capitalize the first letter
    });
};

const fmt = (str) => {
  if (str === true || str === false) {
    return str ? "true" : "false";
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
  if (dateRegex.test(str)) {
    const date = new Date(str);
    return date.toLocaleString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: undefined,
      minute: undefined,
      hour12: undefined,
    });
  }
  return ellipsize(str, 30);
};

const ellipsize = (str, length) => {
  // Put ellipsis in the middle of the string if it's too long
  if (str.length > length) {
    const halfLength = Math.floor(length / 2);
    return `${str.slice(0, halfLength)}...${str.slice(-halfLength)}`;
  }
  return str;
};

export const ObjectDiffViewer = ({ from, to }) => {
  if (!from || !to) {
    return null;
  }

  const oldObj = JSON.parse(from);
  const newObj = JSON.parse(to);

  // Utility function to check if a value is an object
  const isObject = (val) =>
    val && typeof val === "object" && !Array.isArray(val);

  // Recursive function to generate diff data
  const generateDiff = (oldObj, newObj, parentKey = "") => {
    const diffData = [];

    // Get all unique keys from both oldObj and newObj
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    allKeys.forEach((key) => {
      const oldValue = oldObj[key];
      const newValue = newObj[key];
      const fullKey = parentKey ? `${parentKey}.${key}` : key;

      // Skip keys related to IDs or timestamps (uncomment to activate)
      if (fullKey.toLowerCase().includes("id")) {
        return;
      }
      if (fullKey.toLowerCase().includes("updatedat")) {
        return;
      }
      if (fullKey.toLowerCase() == "images") return;
      if (fullKey.toLowerCase() == "items") return;

      // Handle nested objects by recursively calling generateDiff
      if (isObject(oldValue) && isObject(newValue)) {
        // const nestedDiff = generateDiff(oldValue, newValue, fullKey);
        // if (nestedDiff.length > 0) {
        //   diffData.push(
        //     <div key={fullKey}>
        //       <div>{nestedDiff}</div>
        //       <Util.Spacer size={0.5} />
        //     </div>
        //   );
        // }
        diffData.push(
          <div key={fullKey}>"Nested objects are not supported"</div>
        );
      } else if (oldValue !== newValue) {
        // Handle null and empty string case
        const shouldSkipDiff =
          (oldValue === null && newValue === "") ||
          (oldValue === "" && newValue === null);

        if (shouldSkipDiff) {
          return;
        }

        // Handle case where only one is an object (added or removed) or an array
        const oldDisplay = isObject(oldValue)
          ? "(object)"
          : Array.isArray(oldValue)
          ? "(array)"
          : oldValue || "(empty)";
        const newDisplay = isObject(newValue)
          ? "(object)"
          : Array.isArray(newValue)
          ? "(array)"
          : newValue || "(empty)";

        diffData.push(
          <div key={fullKey}>
            <Util.Row gap={1} align="center">
              {/* {switchAttrForIcon(fullKey)}  */}
              {/* TODO: Implement Above */}
              <h4 style={{ marginBottom: 0 }}>
                {convertCamelToSentenceCase(fullKey)}
              </h4>
              <div className={style.diffViewerReset}>
                <Util.Row wrap gap={1} align="center">
                  <Badge
                    soft
                    color={oldDisplay === "(empty)" ? "muted" : "red"}
                  >
                    {fmt(oldDisplay)}
                  </Badge>
                  <Icon i="arrow-right-rhombus" color="#9ba9be" />
                  <Badge
                    soft
                    color={newDisplay === "(empty)" ? "muted" : "green"}
                  >
                    {fmt(newDisplay)}
                  </Badge>
                </Util.Row>
              </div>
            </Util.Row>
            <Util.Spacer size={0.5} />
          </div>
        );
      }
    });

    return diffData;
  };

  return <div>{generateDiff(oldObj, newObj)}</div>;
};
