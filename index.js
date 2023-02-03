const AWS = require('aws-sdk');
const sharp = require('sharp');
const bcrypt = require('bcrypt');

const s3 = new AWS.S3();

exports.handler = async (event, context, callback) => {
  const Bucket = event.Records[0].s3.bucket.name;
  const Key = decodeURIComponent(event.Records[0].s3.object.key);
  const filename = Key.split('/').at(-1);

  const ext = Key.split('.').at(-1).toLowerCase();
  const requiredFormat = ext === 'jpg' ? 'jpeg' : ext;
  console.log('name', bcrypt.hash(filename, 6), 'ext', ext);

  try {
    const s3Object = await s3.getObject({ Bucket, Key }).promise();
    console.log('original', s3Object.Body.length);
    const resizedImage = await sharp(s3Object.Body)
      .resize(500, 500, { fit: 'inside' })
      .toFormat(requiredFormat)
      .toBuffer();
    await s3
      .putObject({
        Bucket,
        Key: `thumb/${bcrypt.hash(filename, 6)}`,
        ContentType: 'image',
        Body: resizedImage,
      })
      .promise();
    console.log('put', resizedImage.length);
    return callback(null, `thumb/${bcrypt.hash(filename, 6)}`);
  } catch (error) {
    console.error(error);
    return callback(error);
  }
};