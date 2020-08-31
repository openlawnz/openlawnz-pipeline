const AWS = require('aws-sdk')

const s3 = new AWS.S3();

const lawReports = [{
    "acronym": "RMA",
    "name": "New Zealand Resource Management Appeals",
    "category": "Resource Management"
}, {
    "acronym": "NZELC",
    "name": "New Zealand Employment Law Cases",
    "category": "Employment"
}, {
    "acronym": "NZBLC",
    "name": "New Zealand Business Law Cases",
    "category": "Commercial"
}, {
    "acronym": "NZCR",
    "name": "New Zealand Criminal Cases",
    "category": "Criminal"
}, {
    "acronym": "ERNZ",
    "name": "Employment Reports of New Zealand",
    "category": "Employment"
}, {
    "acronym": "NZELR",
    "name": "New Zealand Employment Law Reports",
    "category": "Employment"
}, {
    "acronym": "IPR",
    "name": "New Zealand Intellectual Property Reports",
    "category": "Commercial"
}, {
    "acronym": "NZCLC",
    "name": "New Zealand Company Law Cases",
    "category": "Commercial"
}, {
    "acronym": "NZRMA",
    "name": "New Zealand Resource Management Appeals",
    "category": "Resource Management"
}, {
    "acronym": "CRNZ",
    "name": "Criminal Reports of New Zealand",
    "category": "Criminal"
}, {
    "acronym": "FRNZ",
    "name": "Family Reports of New Zealand",
    "category": "Family"
}, {
    "acronym": "ELRNZ",
    "name": "Environmental Law Reports of New Zealand",
    "category": "Resource Management"
}, {
    "acronym": "HRNZ",
    "name": "Human Rights Reports of New Zealand",
    "category": ""
}, {
    "acronym": "TCLR",
    "name": "Trade and Competition Law Reports",
    "category": "Commercial"
}, {
    "acronym": "NZAR",
    "name": "New Zealand Administrative Reports",
    "category": "Public"
}, {
    "acronym": "PRNZ",
    "name": "Procedure Reports of New Zealand",
    "category": "Civil Procedure"
}, {
    "acronym": "NZFLR",
    "name": "New Zealand Family Law Reports",
    "category": "Family"
}, {
    "acronym": "NZTR",
    "name": "New Zealand Trust Reports",
    "category": "Trusts"
}, {
    "acronym": "NZTC",
    "name": "New Zealand Tax Cases",
    "category": ""
}, {
    "acronym": "NZCCLR",
    "name": "New Zealand Company and Commercial Law Reports",
    "category": "Commercial"
}, {
    "acronym": "NZLR",
    "name": "New Zealand Law Reports",
    "category": ""
}, {
    "acronym": "NZCPR",
    "name": "New Zealand Conveyancing and Property Reports",
    "category": ""
}];


const courts = [{
        "name": "Supreme Court",
        "acronyms": ["SSC", "SC", "NZSC"],
        "category": ""
    },
    {
        "name": "Court of Appeal",
        "acronyms": ["SCA", "SCOA", "CA", "COA", "NZCA"],
        "category": ""
    },
    {
        "name": "High Court",
        "acronyms": ["HC", "NZHC", "HK AK", "HK WN"],
        "category": ""
    },
    {
        "name": "District Court",
        "acronyms": ["DC", "NZACC", "NZDC", "DC AK", "DC CHCH", "DC DN", "DC HAM", "DC OAM", "DC PAP", "DC Taupo", "DC WAIT", "DC WANG", "DC WHANG", "DC WN"],
        "category": ""
    },
    {
        "name": "Family Court",
        "acronyms": ["NZFC"],
        "category": "Family"
    },
    {
        "name": "Customs Appeal Authority",
        "acronyms": ["NZCAA"],
        "category": ""
    },
    {
        "name": "Environment Court",
        "acronyms": ["NZEnvC"],
        "category": "Resource Management"
    },
    {
        "name": "Employment Court",
        "acronyms": ["NZEmpC"],
        "category": "Employment"
    },
    {
        "name": "Accident Compensation Appeal Authority",
        "acronyms": ["NZACA", "ACC"],
        "category": "ACC"
    },
    {
        "name": "Broadcasting Standards Authority",
        "acronyms": ["NZBSA"],
        "category": ""
    },
    {
        "name": "Youth Court",
        "acronyms": ["NZYC"],
        "category": ""
    },
    {
        "name": "Privy Council",
        "acronyms": ["UKPC"],
        "category": ""
    },
    {
        "name": "Student Allowance Appeal Authority",
        "acronyms": ["NZSAAA"],
        "category": ""
    },
    {
        "name": "Copyright Tribunal",
        "acronyms": ["NZCOP"],
        "category": "Commercial"
    },
    {
        "name": "Deportation Review Tribunal",
        "acronyms": ["NZDRT"],
        "category": ""
    },
    {
        "name": "Human Rights Review Tribunal",
        "acronyms": ["NZHRRT"],
        "category": ""
    },
    {
        "name": "Immigration Advisers Complaints and Disciplinary Tribunal",
        "acronyms": ["NZIACDT"],
        "category": ""
    },
    {
        "name": "Immigration and Protection Tribunal",
        "acronyms": ["NZIPT"],
        "category": ""
    },
    {
        "name": "International Education Appeal Authority",
        "acronyms": ["NZIEAA"],
        "category": ""
    },
    {
        "name": "Land Valuation Tribunal",
        "acronyms": ["NZLVT"],
        "category": ""
    },
    {
        "name": "Lawyers and Conveyancers Disciplinary Tribunal",
        "acronyms": ["NZLCDT"],
        "category": ""
    },
    {
        "name": "Legal Aid Tribunal",
        "acronyms": ["NZLAT"],
        "category": ""
    },
    {
        "name": "Licensing Authority of Secondhand Dealers and Pawnbrokers",
        "acronyms": ["NZSHD"],
        "category": ""
    },
    {
        "name": "Liquor Licensing Authority",
        "acronyms": ["NZLLA"],
        "category": ""
    },
    {
        "name": "Motor Vehicle Disputes Tribunal",
        "acronyms": ["NZMVDT"],
        "category": ""
    },
    {
        "name": "Private Security Personnel Licensing Authority",
        "acronyms": ["NZPSPLA"],
        "category": ""
    },
    {
        "name": "Real Estate Agents Disciplinary Tribunal",
        "acronyms": ["NZREADT"],
        "category": ""
    },
    {
        "name": "Taxation Review Authority",
        "acronyms": ["NZTRA"],
        "category": ""
    },
    {
        "name": "New Zealand Review Authority",
        "acronyms": ["NZRA"],
        "category": ""
    },
    {
        "name": "Social Security Appeal Authority",
        "acronyms": ["NZSSAA"],
        "category": ""
    },
    {
        "name": "Commerce Commission",
        "acronyms": ["NZCC"],
        "category": ""
    }
]

const makeFriendly = (str) => {
    return str.replace(/\s+/g, '-').toLowerCase();
}

exports.handler = async(event, context) => {

    const parsedCourts = courts.map(c => ({
        id: makeFriendly((c.name)),
        ...c
    }));

    const parsedLawReports = lawReports.map(l => ({
        id: makeFriendly((l.name)),
        ...l
    }))

    try {

        await s3
            .putObject({
                    Body: JSON.stringify(parsedCourts),
                    Bucket: process.env.BUCKET_ACRONYMS,
                    Key: "courts.json",
                    ContentType: 'application/json'
                },
                function (err) {
                    if (err) console.log(err, err.stack);
                }
            )
            .promise()

        await s3
            .putObject({
                    Body: JSON.stringify(parsedLawReports),
                    Bucket: process.env.BUCKET_ACRONYMS,
                    Key: "law-reports.json",
                    ContentType: 'application/json'
                },
                function (err) {
                    if (err) console.log(err, err.stack);
                }
            )
            .promise()

    }
    catch (ex) {
        console.log(ex)
    }
};
