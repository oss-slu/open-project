import moment from "moment";
import React from "react";
import { Table } from "#table";
import { Price } from "#renderPrice";
import { Link } from "react-router-dom";
import { downloadFile } from "../jobitem/JobItem";
import { Badge } from "tabler-react-2";

const switchTypeForBadge = (type) => {
  switch (type) {
    case "INITIAL":
      return (
        <Badge color="green" soft>
          Starting Account Balance
        </Badge>
      );
    case "JOB":
      return (
        <Badge color="red" soft>
          Job
        </Badge>
      );
    case "AUTOMATED_TOPUP":
      return (
        <Badge color="green" soft>
          Automated Topup
        </Badge>
      );
    case "AUTOMATED_DEPOSIT":
      return (
        <Badge color="green" soft>
          Automated Deposit
        </Badge>
      );
    case "MANUAL_TOPUP":
      return (
        <Badge color="green" soft>
          Manual Topup
        </Badge>
      );
    case "MANUAL_DEPOSIT":
      return (
        <Badge color="green" soft>
          Manual Deposit
        </Badge>
      );
    case "FUNDS_PURCHASED":
      return (
        <Badge color="green" soft>
          Funds Purchased
        </Badge>
      );
    case "REFUND":
      return (
        <Badge color="green" soft>
          Refund
        </Badge>
      );
    case "MANUAL_REDUCTION":
      return (
        <Badge color="red" soft>
          Manual Reduction
        </Badge>
      );
    default:
      return type;
  }
};

export const LedgerTable = ({ data, shopId }) => (
  <Table
    columns={[
      {
        label: "Date",
        accessor: "createdAt",
        render: (date) => moment(date).format("MM/DD/YY h:mm a"),
        sortable: true,
      },
      {
        label: "Amount",
        accessor: "value",
        render: (amount) => <Price value={amount} icon />,
        sortable: true,
      },
      {
        label: "Job",
        accessor: "job",
        render: (job, context) => (
          <>
            {job ? (
              <Link to={`/shops/${shopId}/jobs/${context.jobId}`}>
                {job.title}
              </Link>
            ) : (
              "N/A"
            )}
          </>
        ),
      },
      {
        label: "Invoice",
        accessor: "invoiceUrl",
        render: (url, context) =>
          url ? (
            <Link
              onClick={() => downloadFile(url, `invoice-${context.jobId}.pdf`)}
            >
              Download
            </Link>
          ) : (
            "N/A"
          ),
      },
      {
        label: "Type",
        accessor: "type",
        render: (type) => <>{switchTypeForBadge(type)}</>,
        sortable: true,
      },
    ]}
    data={data}
  />
);
