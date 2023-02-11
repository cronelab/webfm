import fs from 'fs'
export default function handler(req, res) {
  var { subject } = req.query
  const metadata = fs.readFileSync(`${process.env.DATA_DIR}/${subject}/.metadata`)
  let brainImage = JSON.parse(metadata.toString()).brainImage;
  res.status(200).json(brainImage);
}



// // Get subject brain image data from .metadata
// app.get("/api/brain/:subject", function(req, res) {
//     var subject = req.params.subject;
//     // First check if subject exists
//     checkSubject(subject, function(err, isSubject) {
//       if (err) {
//         // Based on how checkSubject is defined, this shouldn't happen
//         errOut(
//           500,
//           "Error determining if " +
//             subject +
//             " is a subject: " +
//             JSON.stringify(err)
//         );
//         return;
//       }
  
//       if (!isSubject) {
//         // Not a subject
//         errOut(404, "Subject " + subject + " not found.");
//         return;
//       }
  
//       // We know it's a valid subject, so check if we've got metadata
//       getSubjectMetadata(subject, function(err, metadata) {
//         if (err) {
//           // TODO Be more granular with error codes based on err
//           errOut(
//             500,
//             "Error loading metadata for " + subject + ": " + JSON.stringify(err)
//           );
//           return;
//         }
  
//         // We've got metadata, so check that we've got a brain image
//         if (metadata.brainImage === undefined) {
//           // TODO Better error code for this?
//           errOut(418, assets.noBrainImage);
//           return;
//         }
  
//         res.status(200).send(metadata.brainImage);
//       });
//     });
//   });
  