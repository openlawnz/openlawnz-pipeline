const makeFriendly = (str) => {
    return str.replace(/\s+/g, '-').toLowerCase();
}


module.exports = (jsonData) => {

    let categoryName;
    
    if(jsonData.fileProvider == "acc") {
        categoryName = "acc";
    } else if (jsonData.court && jsonData.court.category) {
        categoryName = jsonData.court.category
    }
    else if (jsonData.lawReport && jsonData.lawReport.category) {
        categoryName = jsonData.lawReport.category
    }

    if (categoryName) {

        jsonData.category = {

            id: makeFriendly(categoryName),
            name: categoryName

        }

    }

    return;

}
