const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const sqs = new AWS.SQS({
    endpoint: "https://sqs.ap-southeast-2.amazonaws.com"
});

const Pool = require('pg').Pool;

let pool;

exports.handler = async(event, context) => {

    if (!pool) {

        pool = new Pool({

            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            port: process.env.PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            client_encoding: 'UTF8'
        })

    }
    
    const psql = await pool.connect();

    console.log(event);

    // SQS record
    
    try {
    
        await Promise.all(event.Records.map(async mainRecord => {
    
            const messageBody = JSON.parse(mainRecord.body);
    
            console.log('messageBody', messageBody);
    
            const objectKey = messageBody.caseFileKey;
    
            console.log(objectKey);
    
            // LEGISLATION IMPORT
            if (objectKey.indexOf("legislation.json") !== -1) {
    
                console.log("Run Legislation - " + objectKey);
    
                console.log("truncate legislation");
    
                await psql.query(`
                        TRUNCATE TABLE main.legislation RESTART IDENTITY CASCADE;
                    `)
    
                // Put the legislation into the DB
    
                // Read legislation.json
                console.log("insert legislation");
                let legislationRaw;
    
                try {
                    legislationRaw = await s3.getObject({
                        Bucket: process.env.INGEST_LEGISLATION_BUCKET,
                        Key: "legislation.json"
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
                        Bucket: process.env.ACRONYMS_BUCKET,
                        Key: "courts.json"
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
                        Bucket: process.env.ACRONYMS_BUCKET,
                        Key: "law-reports.json"
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
            else if (objectKey.indexOf("fullcase/") !== -1) {
    
                console.log("Run fullcase - " + objectKey);
    
                // Read fullcase JSON 
                let caseRaw;
    
                try {
                    caseRaw = await s3.getObject({
                        Bucket: process.env.PDF_OUT_BUCKET,
                        Key: objectKey
                    }).promise()
                }
                catch (ex) {
                    console.log("Error getting citations from S3: " + ex)
                }
    
                const caseRecord = JSON.parse(caseRaw.Body.toString());
    
                try {
                    await psql.query(`
                    				INSERT INTO main.case_pdfs (
                    					pdf_id,
                    					fetch_date,
                    					pdf_provider,
                    					pdf_db_key,
                    					pdf_url,
                    					pdf_checksum
                    					) 
                    				VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`, [
                        caseRecord.fileKey,
                        caseRecord.caseDate,
                        caseRecord.fileProvider,
                        caseRecord.fileKey,
                        caseRecord.fileUrl,
                        caseRecord.pdfChecksum
                    ]);
                }
                catch (ex) {
                    console.log("Error writing case pdf records " + ex)
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
                    					case_footnotes,
                    					case_footnote_contexts,
                    					is_valid,
                    					location) 
                    				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT DO NOTHING`, [
                        caseRecord.fileKey,
                        caseRecord.lawReport ? caseRecord.lawReport.id : null,
                        caseRecord.court ? caseRecord.court.id : null,
                        caseRecord.fileKey,
                        caseRecord.caseDate,
                        caseRecord.caseText,
                        caseRecord.caseNames[0],
                        caseRecord.footnotes,
                        caseRecord.footnoteContexts,
                        caseRecord.isValid,
                        caseRecord.caseLocation
                    ]);
                }
                catch (ex) {
                    console.log("Error writing case record " + ex)
                }
    
            }
    
            // CITATIONS
            else if (objectKey.indexOf("citations/") !== -1) {
    
                console.log("Run Citations - " + objectKey)
    
                // Read citations JSON 
                let citationRaw;
    
                try {
                    citationRaw = await s3.getObject({
                        Bucket: process.env.PDF_OUT_BUCKET,
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
    
                const citationRecord = JSON.parse(citationRaw.Body.toString());
    
                // Write to DB
                try {
                    await psql.query(`
    						INSERT INTO main.case_citations (case_id, citation, id, year) 
    						VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`, [
                        citationRecord.fileKey,
                        citationRecord.citation,
                        citationRecord.id,
                        citationRecord.year
                    ]);
                }
                catch (ex) {
                    console.error({
                        errorType:  ex,
                        errorMessage: "Could not write citation records to DB",
                        stack: console.trace()
                    })
                }
            }
    
            // CASE TO CASE
            else if (objectKey.indexOf("case-to-case") !== -1) {
    
    
                // Put the cases cited
    
                console.log("Run Cases cited - " + objectKey)
    
                // Read citations JSON 
                let casesCitedRaw;
    
                try {
                    casesCitedRaw = await s3.getObject({
                        Bucket: process.env.PDF_OUT_BUCKET,
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
    
                const casesCitedRecord = JSON.parse(casesCitedRaw.Body.toString());
    
                // Write to DB
                try {
    
                    // await psql.query('BEGIN')
                    // Loop
                    for (let x = 0; x < casesCitedRecord.case_cites.length; x++) {
                        console.log("write " + casesCitedRecord.case_origin);
                        await psql.query(`
        						INSERT INTO main.cases_cited (case_origin, case_cited, citation_count) 
        						VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [
                            casesCitedRecord.case_origin,
                            casesCitedRecord.case_cites[x].fileKey,
                            casesCitedRecord.case_cites[x].count
                        ]);
                        //console.log("Writing: " + casesCitedRecord.case_origin + casesCitedRecord.case_cites[x].fileKey + casesCitedRecord.case_cites[x].count);
    
                    }
    
                    // await psql.query('COMMIT')
    
                }
                catch (ex) {
                    await psql.query('ROLLBACK')
                    console.error({
                        errorType: ex,
                        errorMessage: "Could not write casesCited to DB",
                        stack: console.trace()
                        })
                }
    
                //  LEGISLATION
            }
    
            // LEGISLATION TO CASES
            else if (objectKey.indexOf("legislation-references") !== -1) {
    
                // Put the legislation cited in the db
    
                console.log("Run Legislation Cited - " + objectKey)
    
                // Read legislation JSON 
                let legislationCitedRaw;
    
                try {
                    legislationCitedRaw = await s3.getObject({
                        Bucket: process.env.PDF_OUT_BUCKET,
                        Key: objectKey
                    }).promise()
                }
                catch (ex) {
                    console.error("Error getting legislation references json from S3: " + ex)
                }
    
                const legislationCitedRecord = JSON.parse(legislationCitedRaw.Body.toString());
    
                // Write to DB
                try {
    
    
                    // await psql.query('BEGIN')
                    // Loop
                    for (let k in legislationCitedRecord.legislationReferences) {
    
                        const legislationReference = legislationCitedRecord.legislationReferences[k];
    
                        console.log("legislationReference", legislationReference);
    
                        const groupedSections = Object.values(legislationReference.groupedSections);
    
                        console.log("groupedSections", groupedSections)
    
                        for (let groupedSectionKey in groupedSections) {
    
                            const groupedSection = groupedSections[groupedSectionKey];
    
                            console.log("writing: " + legislationReference.legislationId,
                                groupedSection.id +
                                legislationCitedRecord.caseId +
                                groupedSection.count);
    
                            await psql.query(`
        						INSERT INTO main.legislation_to_cases (legislation_id, section, case_id, count) 
        						VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`, [
                                legislationReference.legislationId,
                                groupedSection.id,
                                legislationCitedRecord.caseId,
                                groupedSection.count
                            ]);
    
    
                        }
    
    
                    }
    
                    // await psql.query('COMMIT')
    
                }
                catch (ex) {
                    // await psql.query('ROLLBACK')
                    console.error("Error writing legislation to db" + ex)
                }
    
            }
    
            // CATEGORIES
            else if (objectKey.indexOf("categories/") !== -1) {
    
                console.log("Run Categories - " + objectKey)
    
                // Read citations JSON 
                let categoryRaw;
    
                try {
                    categoryRaw = await s3.getObject({
                        Bucket: process.env.PDF_OUT_BUCKET,
                        Key: objectKey
                    }).promise()
                }
                catch (ex) {
                    console.error("Error getting citations from S3: " + ex)
                }
    
                const categoryRecord = JSON.parse(categoryRaw.Body.toString());
    
                // Write to DB
                try {
                    await psql.query(`
    						INSERT INTO main.categories (id, category) 
    						VALUES ($1, $2) ON CONFLICT DO NOTHING`, [
                        categoryRecord.id,
                        categoryRecord.name,
                    ]);
    
                    await psql.query(`
    						INSERT INTO main.category_to_cases (case_id, category_id) 
    						VALUES ($1, $2) ON CONFLICT DO NOTHING`, [
                        categoryRecord.fileKey,
                        categoryRecord.id
                    ]);
                }
                catch (ex) {
                    console.error("Error writing categories to db" + ex)
                }
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
                        Bucket: process.env.JUDGE_TITLES_BUCKET,
                        Key: "judge-titles.json"
                    }).promise()
                }
                catch (ex) {
                    console.log("Error getting judge titles from S3: " + ex)
                }
    
                const judgeTitlesRecord = JSON.parse(judgeTitlesRaw.Body.toString());
    
                // await psql.query('BEGIN');
    
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
                    // await psql.query('COMMIT');
                }
                catch (ex) {
                    console.log("Error writing judge titles: " + ex);
                    // await psql.query('ROLLBACK');
                }
            }
    
            // CASE REPRESENTATION
            else if (objectKey.indexOf("representation/") !== -1) {
    
                console.log("Run Representation - " + objectKey)
    
                // Read representation JSON 
                let representationRaw;
    
                try {
                    representationRaw = await s3.getObject({
                        Bucket: process.env.PDF_OUT_BUCKET,
                        Key: objectKey
                    }).promise()
                }
                catch (ex) {
                    console.error("Error getting representations from S3: " + ex)
                }
    
                const representationRecord = JSON.parse(representationRaw.Body.toString());
    
    
    
                // Write to DB
                try {
                    await psql.query(`
    						INSERT INTO main.party_and_representative_to_cases (case_id, names, party_type, appearance) 
    						VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`, [
                        representationRecord.fileKey,
                        representationRecord.initiation.names,
                        representationRecord.initiation.party_type,
                        representationRecord.initiation.appearance,
                    ]);
    
                    if (representationRecord.response) {
    
                        await psql.query(`
    						INSERT INTO main.party_and_representative_to_cases (case_id, names, party_type, appearance) 
    						VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`, [
                            representationRecord.fileKey,
                            representationRecord.response.names,
                            representationRecord.response.party_type,
                            representationRecord.response.appearance,
                        ]);
                    }
    
                }
                catch (ex) {
                    console.error("Error writing representation to db" + ex)
                    console.error(representationRecord)
                }
            }
    
            // JUDGES TO CASE
            else if (objectKey.indexOf("judges/") !== -1) {
    
                console.log("Run Judges - " + objectKey)
    
                // Read judges JSON 
                let judgesRaw;
    
                try {
                    judgesRaw = await s3.getObject({
                        Bucket: process.env.PDF_OUT_BUCKET,
                        Key: objectKey
                    }).promise()
                }
                catch (ex) {
                    console.error("Error getting judges to cases from S3: " + ex)
                }
    
                const judgesRecord = JSON.parse(judgesRaw.Body.toString());
    
                for (let jindex = 0; jindex < judgesRecord.judges.length; jindex++) {
    
                    const judge = judgesRecord.judges[jindex];
                    // Write to DB
                    try {
                        await psql.query(`
    						INSERT INTO main.judge_to_cases (title_id, name, case_id) 
    						VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [
                            judge.title_id,
                            judge.name,
                            judgesRecord.fileKey
                        ]);
    
                    }
                    catch (ex) {
                        console.error("Error writing judges to cases to db" + ex)
                    }
                }
            }
            
            // FACETS FOR FUNNEL PARSERS 
            else if (objectKey.indexOf("facets.json") !== -1) {
    
                console.log("Run import facets - " + objectKey)
    
                console.log("truncate facets");
    
                try {
                    await psql.query(`
                        TRUNCATE TABLE funnel.facets RESTART IDENTITY CASCADE;
                        TRUNCATE TABLE funnel.facet_boolean_keywords RESTART IDENTITY CASCADE;
                    `)
                }
                catch (ex) { console.log('could not truncate funnel facets'); }
    
                // Read facets JSON 
                let facetsRaw;
    
                try {
                    facetsRaw = await s3.getObject({
                        Bucket: process.env.FACETS_BUCKET,
                        Key: "facets.json"
                    }).promise()
                }
                catch (ex) {
                    console.error("Error getting facets from S3: " + ex)
                }
    
                const facetRecord = JSON.parse(facetsRaw.Body.toString());
    
                // await psql.query('BEGIN');
                
                try {
                    
                    const booleanFacets = facetRecord.booleanFacets;
                    
                    
                    for(let b in booleanFacets) {
                        const facet = booleanFacets[b];
                        
                        await psql.query(`
        					INSERT INTO funnel.facets (id, name, description, type) 
        					VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`, [
                            facet.id,
                            facet.name,
                            facet.description,
                            "boolean",
                        ]);
                        
                        const options = facet.options;
                        
                        for(let o in options) {
                            const option = options[o];
                            
                            await psql.query(`
            					INSERT INTO funnel.facet_boolean_keywords (id, facet_id, value, whole_word) 
            					VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`, [
                                option.id,
                                facet.id,
                                option.value,
                                option.wholeWord
                            ]);
                            
                        }
                        
                    }
                    
                    const dateFacets = facetRecord.dateFacets;
                    
                    for(let d in dateFacets) {
                        const facet = dateFacets[d];
                        
                        await psql.query(`
        					INSERT INTO funnel.facets (id, name, type) 
        					VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [
                            facet.id,
                            facet.name,
                            "date",
                        ]);
                        
                    }
                }
                
                catch (ex) {
                    console.error("Error writing facets: " + ex);
                    // await psql.query('ROLLBACK');
                }
            }
    
            else {
    
                console.log("Unhandled S3 event - Object key: " + objectKey)
            }
    
        }));
        
    } catch(ex) {
        
      
    }
    
    psql.release()
    

};
