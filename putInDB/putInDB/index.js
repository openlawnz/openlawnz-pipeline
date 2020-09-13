const AWSXRay = require('aws-xray-sdk-core')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))

const s3 = new AWS.S3();

const Pool = require('pg').Pool;

const checkFileExists = async(bucket, key) => {
    let exists = false;
    // Check if it exists in S3 first
    try {

        await s3.headObject({
            Bucket: bucket,
            Key: key
        }).promise();

        exists = true;

    }
    catch (ex) {}

    return exists;
}


const getJSONFile = async(bucket, key) => {

    let raw = await s3.getObject({
        Bucket: bucket,
        Key: key
    }).promise();

    return JSON.parse(raw.Body.toString());

};


let pool;

exports.handler = async(event) => {

    const records = event.Records.map(r => JSON.parse(r.body)).filter(r => r.eventName === "ObjectCreated:Put");

    if (records.length === 0) {
        return;
    }

    try {
        if (!pool) {

            const messageBody = JSON.parse(event.Records[0].body);
            const bucketNameArr = messageBody.bucketName.split('-');
            const environment = bucketNameArr[bucketNameArr.length - 1];

            pool = new Pool({

                host: process.env.DB_HOST,
                database: environment,
                port: process.env.PORT,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                client_encoding: 'UTF8'
            })

        }

        const psql = await pool.connect();

        // Receive the SQS record

        await Promise.all(records.map(async messageBody => {

            try {

                const bucketName = messageBody.bucketName;
                const objectKey = messageBody.objectKey;

                const caseRecord = await getJSONFile(bucketName, objectKey);

                // LEGISLATION IMPORT
                if (objectKey.indexOf("legislation.json") !== -1) {

                    await psql.query(`
                        TRUNCATE TABLE main.legislation RESTART IDENTITY CASCADE;
                    `)

                    // Put the legislation into the DB

                    // Read legislation.json
                    let legislationRaw;

                    try {
                        legislationRaw = await s3.getObject({
                            Bucket: bucketName,
                            Key: objectKey
                        }).promise();
                    }
                    catch (ex) {
                        console.log("Error getting legislation: " + ex);
                    }

                    const legislationRecord = JSON.parse(legislationRaw.Body.toString());

                    // Insert rows
                    for (let a in legislationRecord) {
                        const legislationItem = legislationRecord[a];

                        try {
                            await psql.query(`
            			INSERT INTO main.legislation (
            				id,
                            title,
            				link,
            				year,
            				alerts)
            			VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`, [
                            legislationItem.id,
                            legislationItem.title,
                            legislationItem.link,
                            legislationItem.year,
                            legislationItem.alerts
                        ])
                        }
                        catch (ex) {
                            console.log("Error writing legislation to db: " + ex);
                        }
                    }
                }

                // COURTS IMPORT
                else if (objectKey.indexOf("courts.json") !== -1) {

                    console.log("Run courts - " + objectKey);

                    console.log("truncate courts");

                    await psql.query(`
                        TRUNCATE TABLE main.courts RESTART IDENTITY CASCADE;
                    `)

                    // Put the legislation into the DB

                    // Read legislation.json
                    console.log("insert courts");
                    let courtsRaw;

                    try {
                        courtsRaw = await s3.getObject({
                            Bucket: bucketName,
                            Key: objectKey
                        }).promise();
                    }
                    catch (ex) {
                        console.log("Error getting courts: " + ex);
                    }

                    const courtsRecord = JSON.parse(courtsRaw.Body.toString());

                    // Insert rows
                    for (let a in courtsRecord) {
                        const courtsItem = courtsRecord[a];

                        try {
                            await psql.query(`
            			INSERT INTO main.courts (
            				id,
                            acronyms,
                            name)
            			VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [
                            courtsItem.id,
                            courtsItem.acronyms,
                            courtsItem.name,
                        ])
                        }
                        catch (ex) {
                            console.log("Error writing courts to db: " + ex);
                        }
                    }
                }

                // LAW REPORT IMPORT
                else if (objectKey.indexOf("law-reports.json") !== -1) {

                    console.log("Run law reports - " + objectKey);

                    console.log("truncate law reports");

                    await psql.query(`
                        TRUNCATE TABLE main.law_reports RESTART IDENTITY CASCADE;
                    `)

                    // Put the legislation into the DB

                    // Read legislation.json
                    console.log("insert law reports");
                    let lawReportsRaw;

                    try {
                        lawReportsRaw = await s3.getObject({
                            Bucket: bucketName,
                            Key: objectKey
                        }).promise();
                    }
                    catch (ex) {
                        console.log("Error getting law reports: " + ex);
                    }

                    const lawReportsRecord = JSON.parse(lawReportsRaw.Body.toString());

                    // Insert rows
                    for (let a in lawReportsRecord) {
                        const lawReportItem = lawReportsRecord[a];

                        try {
                            await psql.query(`
            			INSERT INTO main.law_reports (
            				id,
                            acronym,
                            name)
            			VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [
                            lawReportItem.id,
                            lawReportItem.acronym,
                            lawReportItem.name,
                        ])
                        }
                        catch (ex) {
                            console.log("Error writing law report to db: " + ex);
                        }
                    }
                }

                // FULL CASE
                else if (objectKey.indexOf("cases/") !== -1) {

                    // Look up the run key

                    const fileExistsSuccess = await checkFileExists(
                        caseRecord.caseMeta.buckets.BUCKET_PIPELINE_PROCESSING_WITH_ENV,
                        `${caseRecord.runKey}/success/${caseRecord.fileKey}.json`
                    )

                    if (fileExistsSuccess) {
                        console.log('File has already been processed successfully');
                        return;
                    }

                    const fileExistsError = await checkFileExists(
                        caseRecord.caseMeta.buckets.BUCKET_PIPELINE_PROCESSING_WITH_ENV,
                        `${caseRecord.runKey}/errors/${caseRecord.fileKey}.json`
                    )

                    if (fileExistsError) {
                        console.log('File has already failed');
                        return;
                    }

                    const casePDFsValues = [
                    caseRecord.fileKey,
                    caseRecord.caseDate,
                    caseRecord.fileProvider,
                    caseRecord.fileKey,
                    caseRecord.fileUrl,
                    caseRecord.pdfChecksum,
                    caseRecord.parsersVersion
                ];

                    const caseValues = [
                    caseRecord.fileKey,
                    caseRecord.lawReport ? caseRecord.lawReport.id : null,
                    caseRecord.court ? caseRecord.court.id : null,
                    caseRecord.fileKey,
                    caseRecord.caseDate,
                    caseRecord.caseText,
                    caseRecord.caseNames[0],
                    caseRecord.isValid,
                    caseRecord.caseLocation,
                    caseRecord.conversionEngine,
                    caseRecord.filingNumber,
                    caseRecord.parsersVersion
                ]

                    const existsResult = await psql.query(`SELECT COUNT(*) FROM main.cases WHERE id = $1`, [caseRecord.fileKey]);

                    if (existsResult.rows[0].count == 0) {

                        try {
                            await psql.query(`
                    				INSERT INTO main.case_pdfs (
                    					pdf_id,
                    					fetch_date,
                    					pdf_provider,
                    					pdf_db_key,
                    					pdf_url,
                    					pdf_checksum,
                    					parsers_version
                    					)
                    				VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`, casePDFsValues);
                        }
                        catch (ex) {
                            console.error("Error writing case pdf records " + ex);
                            console.error(caseRecord);
                            return;
                        }

                        try {
                            await psql.query(`
                    				INSERT INTO main.cases (
                    					id,
                    					lawreport_id,
                    					court_id,
                    					pdf_id,
                    					case_date,
                    					case_text,
                    					case_name,
                    					is_valid,
                    					location,
                    					conversion_engine,
                    					court_filing_number,
                    					parsers_version)
                    				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) ON CONFLICT DO NOTHING`, caseValues);
                        }
                        catch (ex) {
                            console.error("Error writing case record " + ex);
                            console.error(caseRecord);
                            return;
                        }

                    }
                    else {

                        try {
                            await psql.query(`
                    				UPDATE main.case_pdfs
                    				SET
                    					fetch_date = $2,
                    					pdf_provider = $3,
                    					pdf_db_key = $4,
                    					pdf_url = $5,
                    					pdf_checksum = $6,
                    					parsers_version = $7
                    				WHERE pdf_id = $1`, casePDFsValues);
                        }
                        catch (ex) {
                            console.error("Error writing case pdf records update " + ex);
                            console.error(caseRecord);
                            return;
                        }

                        try {
                            await psql.query(`
                    				UPDATE main.cases
                    				SET
                    					lawreport_id = $2,
                    					court_id = $3,
                    					pdf_id = $4,
                    					case_date = $5,
                    					case_text = $6,
                    					case_name = $7,
                    					is_valid = $8,
                    					location = $9,
                    					conversion_engine = $10,
                    					court_filing_number = $11,
                    					parsers_version = $12
                    				WHERE id = $1`, caseValues);
                        }
                        catch (ex) {
                            console.error("Error writing case record update " + ex);
                            console.error(caseRecord);
                            return;
                        }


                    }


                    //---------------------------------------------------------------------
                    // Representation
                    //---------------------------------------------------------------------

                    try {

                        // Delete relationships
                        await psql.query(`DELETE FROM main.party_and_representative_to_cases WHERE case_id = $1`, [caseRecord.fileKey]);

                        const representationRecord = await psql.query(`
    						INSERT INTO main.party_and_representative_to_cases (case_id, names, party_type, appearance, parsers_version)
    						VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`, [
                        caseRecord.fileKey,
                        caseRecord.representation.initiation.names,
                        caseRecord.representation.initiation.party_type,
                        caseRecord.representation.initiation.appearance,
                        caseRecord.parsersVersion
                    ]);

                        if (representationRecord.response) {

                            await psql.query(`
    						INSERT INTO main.party_and_representative_to_cases (case_id, names, party_type, appearance, parsers_version)
    						VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`, [
                            caseRecord.fileKey,
                            caseRecord.representation.response.names,
                            caseRecord.representation.response.party_type,
                            caseRecord.representation.response.appearance,
                            caseRecord.parsersVersion
                        ]);
                        }

                    }
                    catch (ex) {
                        console.error("Error writing representation to db" + ex)
                        console.error(caseRecord.representation)
                    }




                    //---------------------------------------------------------------------
                    // Judges to Cases
                    //---------------------------------------------------------------------

                    try {
                        // Delete relationships
                        await psql.query(`DELETE FROM main.judge_to_cases WHERE case_id = $1`, [caseRecord.fileKey]);

                        for (let jindex = 0; jindex < caseRecord.judges.length; jindex++) {

                            const judge = caseRecord.judges[jindex];
                            // Write to DB

                            await psql.query(`
    						INSERT INTO main.judge_to_cases (title_id, name, case_id, parsers_version)
    						VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`, [
                            judge.title_id,
                            judge.name,
                            caseRecord.fileKey,
                            caseRecord.parsersVersion
                        ]);


                        }

                    }
                    catch (ex) {
                        console.error("Error writing judges to cases to db" + ex)
                    }


                    //---------------------------------------------------------------------
                    // Category
                    //---------------------------------------------------------------------

                    try {

                        if (caseRecord.category) {

                            // Delete relationships
                            await psql.query(`DELETE FROM main.category_to_cases WHERE case_id = $1`, [caseRecord.fileKey]);

                            await psql.query(`
        						INSERT INTO main.categories (id, category)
        						VALUES ($1, $2) ON CONFLICT DO NOTHING`, [
                            caseRecord.category.id,
                            caseRecord.category.name,
                        ]);

                            await psql.query(`
        						INSERT INTO main.category_to_cases (case_id, category_id)
        						VALUES ($1, $2) ON CONFLICT DO NOTHING`, [
                            caseRecord.fileKey,
                            caseRecord.category.id
                        ]);

                        }
                    }
                    catch (ex) {
                        console.error("Error writing categories to db" + ex)
                    }



                    //---------------------------------------------------------------------
                    // Legislation References
                    //---------------------------------------------------------------------

                    try {

                        // Delete relationships
                        await psql.query(`DELETE FROM main.legislation_to_cases WHERE case_id = $1`, [caseRecord.fileKey]);

                        // Loop

                        if (caseRecord.legislation) {

                            const lrefs = caseRecord.legislation.legislationReferences;

                            for (let k = 0; k < lrefs.length; k++) {

                                const legislationReference = lrefs[k];

                                const groupedSections = Object.values(legislationReference.groupedSections);

                                for (let groupedSectionKey in groupedSections) {

                                    const groupedSection = groupedSections[groupedSectionKey];

                                    await psql.query(`
            						INSERT INTO main.legislation_to_cases (legislation_id, extraction_confidence, section, case_id, count, parsers_version)
            						VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`, [
            						legislationReference.legislationId,
            						caseRecord.legislation.extractionConfidence,
                                    groupedSection.id,
                                    caseRecord.fileKey,
                                    groupedSection.count,
                                    caseRecord.parsersVersion
                                ]);

                                }

                            }

                        }

                    }
                    catch (ex) {
                        console.error("Error writing legislation to db" + ex);
                        console.error(JSON.stringify(caseRecord, null, 4));
                    }

                    // Write the citation objects

                    try {

                        for (let c of caseRecord.caseCitations) {

                            await s3
                                .putObject({
                                    Body: JSON.stringify({
                                        ...c,
                                        parsersVersion: caseRecord.parsersVersion
                                    }),
                                    Bucket: caseRecord.caseMeta.buckets.BUCKET_PERMANENT_JSON_WITH_ENV,
                                    Key: 'citations/' + c.id + ".json",
                                    ContentType: 'application/json'
                                })
                                .promise();

                        }

                        // Lets the Cloudwatch rule know that this case has finished
                        // Make sure to reference BUCKET_PIPELINE_PROCESSING_WITH_ENV and not permament storage otherwise infinite loop

                        await s3.putObject({
                            Bucket: caseRecord.caseMeta.buckets.BUCKET_PIPELINE_PROCESSING_WITH_ENV,
                            Key: `${caseRecord.runKey}/success/${caseRecord.fileKey}.json`,
                            Body: JSON.stringify({
                                fileKey: caseRecord.fileKey
                            })
                        }).promise();


                    }
                    catch (ex) {
                        console.error("Error writing object to processing success bucket", ex)
                        console.error(caseRecord)
                    }


                }

                // CITATIONS
                else if (objectKey.indexOf("citations/") !== -1) {

                    // Read citations JSON
                    let citationRaw;

                    try {
                        citationRaw = await s3.getObject({
                            Bucket: bucketName,
                            Key: objectKey
                        }).promise()
                    }
                    catch (ex) {
                        console.error({
                            errorType: ex,
                            errorMessage: "S3 event includes citations but could not get citation file from s3. Key: " + objectKey,
                            stack: console.trace()
                        })
                    }

                    if (!citationRaw) {
                        return;
                    }

                    try {

                        const citationRecord = JSON.parse(citationRaw.Body.toString());

                        // Write to DB

                        await psql.query(`
    						INSERT INTO main.case_citations (case_id, citation, id, year, parsers_version)
    						VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`, [
                        citationRecord.fileKey,
                        citationRecord.citation,
                        citationRecord.id,
                        citationRecord.year,
                        citationRecord.parsersVersion
                    ]);
                    }
                    catch (ex) {
                        console.error({
                            errorType: ex,
                            errorMessage: "Could not write citation records to DB",
                            stack: console.trace()
                        })
                    }
                }

                // CASE TO CASE
                else if (objectKey.indexOf("case-to-case") !== -1) {

                    // Read citations JSON
                    let casesCitedRaw;

                    try {
                        casesCitedRaw = await s3.getObject({
                            Bucket: bucketName,
                            Key: objectKey
                        }).promise()
                    }
                    catch (ex) {
                        console.error({
                            errorType: ex,
                            errorMessage: "S3 event was case-to-case but could not get file from s3. Key: " + objectKey,
                            stack: console.trace()
                        })
                    }

                    if (!casesCitedRaw) {
                        return;
                    }

                    try {
                        const casesCitedRecord = JSON.parse(casesCitedRaw.Body.toString());

                        // Write to DB


                        // Loop
                        for (let x = 0; x < casesCitedRecord.case_cites.length; x++) {

                            await psql.query(`
        						INSERT INTO main.cases_cited (case_origin, case_cited, citation_count, parsers_version)
        						VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`, [
                            casesCitedRecord.case_origin,
                            casesCitedRecord.case_cites[x].fileKey,
                            casesCitedRecord.case_cites[x].count,
                            casesCitedRecord.parsersVersion
                        ]);

                        }


                    }
                    catch (ex) {

                        console.error({
                            errorType: ex,
                            errorMessage: "Could not write casesCited to DB",
                            stack: console.trace()
                        })
                    }

                    //  LEGISLATION
                }

                // JUDGE TITLES IMPORT
                else if (objectKey.indexOf("judge-titles.json") !== -1) {

                    console.log("Run Judge Titles - " + objectKey)

                    console.log("truncate judge titles");

                    try {
                        await psql.query(`
                        TRUNCATE TABLE main.judge_titles RESTART IDENTITY CASCADE;
                    `)
                    }
                    catch (ex) { console.log('could not truncate judge titles'); }

                    // Read judge titles JSON
                    let judgeTitlesRaw;

                    try {
                        judgeTitlesRaw = await s3.getObject({
                            Bucket: bucketName,
                            Key: objectKey
                        }).promise()
                    }
                    catch (ex) {
                        console.log("Error getting judge titles from S3: " + ex)
                    }

                    const judgeTitlesRecord = JSON.parse(judgeTitlesRaw.Body.toString());

                    try {
                        for (let jt in judgeTitlesRecord) {
                            const judge_title = judgeTitlesRecord[jt];
                            await psql.query(`
    						INSERT INTO main.judge_titles (id, short_title, long_titles)
    						VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [
                            jt,
                            judge_title.short_title,
                            judge_title.long_titles,
                        ]);
                        }
                    }
                    catch (ex) {
                        console.log("Error writing judge titles: " + ex);

                    }
                }

                else {

                    //console.log("Unhandled S3 event - Object key: " + objectKey)
                }

            }
            catch (ex) {

                console.log(ex)

            }

        }));



        psql.release()

    }
    catch (ex) {
        console.error("General exception", ex)
    }


};
