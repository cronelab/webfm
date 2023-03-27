export default function handler(req, res) {
  var { subject, record } = req.query

  var recordInfo = {
    subject: subject,
    record: record,
    isBundle: false,
    uri: `/api/data/${subject}/${record}`
  };

  res.json(recordInfo);

}

