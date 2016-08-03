var vmSearch = new Vue({
    el: '#search',
    data: {
        search: '',
    },
    watch: {
        'search': function (newVal, oldVal) {
            if (newVal.length >= 2) {
                socket.emit('search suggestions', newVal);
            }
        }
    },
    methods: {
        searchItem: function () {
            console.log('looking for: ' + this.search);
            socket.emit('search item', this.search);
        }
    }
});

vmSearch.choices = [];

socket.on('search suggestions', function (data) {
    vmSearch.choices = data;
})

new autoComplete({
    selector: 'input[id="inputSearch"]',
    minChars: 2,
    source: function (term, suggest) {
        term = term.toLowerCase();
        var choices = ['ActionScript', 'AppleScript', 'Asp', 'Cobol', 'C']; // Auswahlliste
        var matches = [];

        for (i=0; i<choices.length; i++)
            if (~choices[i].toLowerCase().indexOf(term)) matches.push(choices[i]);
        
        suggest(matches);
    }
})