var vmSearch = new Vue({
    el: '#search',
    data: {
        search: '',
    },
    methods: {
        searchItem: function () {
            socket.emit('search item', this.search);
        }
    }
});

new autoComplete({
    selector: 'input[id="inputSearch"]',
    minChars: 2,
    delay: 300,
    source: function (term, suggest) {
        term = term.toLowerCase() + ':*';

        socket.emit('search suggestions', term);
        socket.on('search suggestions', function (data) {
            if (data.length == 0) suggest([""]);
            else suggest(data);
        });
    },
    onSelect: function (e, term, item) {
        vmSearch.search = term;
    }
});

socket.on('search item', function(data) {
    console.log('search result:');
    console.log(data);
});