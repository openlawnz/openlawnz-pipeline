const doubleJusticePattern = {
    CourtDoubleJustice:/\s{2}Court:\s*([\s\S]*),\s([a-zA-Z0-9\u00C0-\u02AB ']*)\s+JJ\s{3}[\r\n\f]*/,
    CourtDoubleJustice2:/\s{2}Court:\s*([a-zA-Z0-9\u00C0-\u02AB ']*)\s+JJ\s[\r\n\f]*\s/
};
const textSeparators = [',', ' AND '];
module.exports = (data, judgeTitles) =>
{
    let result = [];
    for (var key in doubleJusticePattern) {
        var temp = data.match(doubleJusticePattern[key]);
        if(temp)
        {
            var tempLength = temp.length;
            var tempIndex = 0;
            for(var i = 1; i < tempLength; i++)
            {
                //jdo_1537189201000_e1fa7853-d38a-4c9a-8cc6-a68d5462f955.pdf
                var justices = temp[i].split(new RegExp(textSeparators.join('|'), 'gi'));
                var justicesLength = justices.length;
                for(var counter = 0; counter < justicesLength; counter++)
                {
                    var proceed = true;
                    var justiceValue = justices[counter].trim();
                    for (const property in judgeTitles) {
                        //console.log(`${property}: ${object[property]}`);
                        const judgeTitleRegExp = new RegExp(`\^\[a-zA-Z0-9\u00C0-\u02AB\s\']*\\s+${judgeTitles[property].short_title}`);
                        if(justiceValue.match(judgeTitleRegExp))
                        {
                            proceed = false;
                        }
                    }
                    if(proceed)
                    {
                        if(tempIndex === 0)
                        {
                            tempIndex = temp.index;
                        }
                        result.push(justiceValue);
                    }
                }
            }
            return { value: result, valueIndex: tempIndex };
        }
    }
    return null;
}