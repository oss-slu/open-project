import styled from "styled-components";

const computeGap = (gap) =>
  typeof gap === "number" ? `${gap * 8}px` : gap || "0px";

export const Grow = styled.div`
  flex-grow: 1;
`;

export const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: ${(props) => props.align || "center"};
  justify-content: ${(props) => props.justify || "flex-start"};
  gap: ${(props) => computeGap(props.gap)};
  flex-wrap: ${(props) => (props.wrap ? "wrap" : "nowrap")};
`;

export const Col = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${(props) => props.align || "center"};
  justify-content: ${(props) => props.justify || "center"};
  gap: ${(props) => computeGap(props.gap)};
`;

export const Responsive = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: ${(props) => (props.wrap ? "wrap" : "nowrap")};

  align-items: ${(props) => props.rowAlign || props.align || "center"};
  justify-content: ${(props) =>
    props.rowJustify || props.justify || "flex-start"};
  gap: ${(props) => computeGap(props.rowGap || props.gap)};

  @media (max-width: ${(props) => props.breakpoint || 768}px) {
    flex-direction: column;
    align-items: ${(props) => props.colAlign || props.align || "center"};
    justify-content: ${(props) =>
      props.colJustify || props.justify || "flex-start"};
    gap: ${(props) => computeGap(props.colGap || props.gap)};
  }
`;
