( function($) {

	var state;
	var current_page;

	function render_page ( page ) {
		if ( !page.next_pages || page.next_pages.length==0 ) {
			alert( 'No further pages!' );
			return false;
		}
		$( "#next_pages" ).html( "" );
		$( "#html" ).html( page.html );
		for ( var link of page.next_pages ) {
			let link_id = link[0];
			let link_desc = link[1];
			let link_classes = 'text-primary';
			if ( link[2].css_class == 'success' ) { link_classes = 'text-success'; }
			if ( link[2].css_class == 'danger' )  { link_classes = 'text-danger';  }
			if ( link[2].css_class == 'warning' ) { link_classes = 'text-warning'; }
			if ( link[2].css_class == 'info' )    { link_classes = 'text-info';    }
			$( "#next_pages" ).append(
				'<div><a href="#" class=" ' + link_classes + '" x-data-page-id="' + link_id + '">' + link_desc + '</a></div>'
			);
		}
		state = page.state;
		current_page = page;
		after_render_page( page );
	}

	function get_page ( page_id ) {
		$.ajax( API + '/story/' + encodeURIComponent(STORY_ID) + '/page/' + encodeURIComponent(page_id), {
			method: 'POST',
			data: JSON.stringify( { "state": state } ),
			contentType: 'application/json',
			success: render_page,
			dataType: 'json',
		} );
	}

	// Load initial state...
	$( function () {
		$.get( API + '/state/init', {}, function ( data ) {
			state = data.state;
			get_page( 'main' );
		}, 'json' );
	} );

	// Make page links work...
	$( "#next_pages" ).on( "click", "a", function ( e ) {
		e.preventDefault();
		let page_id = $( this ).attr( "x-data-page-id" );
		get_page( page_id );
	} );

	// Save button
	$( "#save" ).on( "click", function ( e ) {
		let d = Date.now();
		let label = prompt( "Please enter a label for the bookmark", "Unlabelled" );
		let page = current_page;
		localforage.getItem( STORAGE_KEY, function ( err, bookmark_storage ) {
			if ( err ) {
				console.log( err );
				alert( "Error storing game" );
				return;
			}
			if ( ! bookmark_storage ) {
				bookmark_storage = [];
			}
			bookmark_storage.push( {
				"date": d,
				"label": label,
				"stored_data": page,
			} );
			localforage.setItem( STORAGE_KEY, bookmark_storage, function ( err ) {
				if ( err ) {
					console.log( err );
					alert( "Error storing bookmark" );
					return;
				}
				refresh_bookmark_list();
			} );
		} );
	} );

	function refresh_bookmark_list () {
		localforage.getItem( STORAGE_KEY, function ( err, bookmark_storage ) {
			if ( err ) {
				console.log( err );
				alert( "Error reading bookmarks" );
				return;
			}
			if ( ! bookmark_storage ) {
				bookmark_storage = [];
			}
			$( "#saved_games" ).html( "" );
			for (var i = bookmark_storage.length - 1; i >= 0; i--) {
				let g = bookmark_storage[i];
				let d = new Date( g.date );
				$( "#saved_games" ).append(
					'<li class="list-group-item text-bg-dark" x-data-saved-game-ix="' + i + '">' +
					'<div><strong>' + g.label + '</strong> <small style="font-size:75%">' + d.toISOString() + '</small></div>' +
					'<div><small><a class="text-primary saved-game-go" href="#">Go here</a></small> &middot; ' +
					'<small><a class="text-success saved-game-save" href="#">Save</a></small> &middot; ' +
					'<small><a class="text-danger saved-game-delete" href="#">Delete</a></small></div>' +
					'</li>'
				);
			}
		} );
	}

	$( "#saved_games" ).on( "click", ".saved-game-go", function ( e ) {
		let ix = $( this ).parents( "li" ).attr( "x-data-saved-game-ix" );
		if ( confirm( "Return to bookmark? Any progress you have made since then will be lost." ) ) {
			localforage.getItem( STORAGE_KEY, function ( err, bookmark_storage ) {
				if ( err ) {
					console.log( err );
					alert( "Error reading bookmarks" );
					return;
				}
				render_page( bookmark_storage[ix].stored_data );
				$( '#sidebar' ).offcanvas( 'hide' );
			} );
		}
	} );
	
	$( "#saved_games" ).on( "click", ".saved-game-save", function ( e ) {
		let ix = $( this ).parents( "li" ).attr( "x-data-saved-game-ix" );
		if ( confirm( "Replace this bookmark with the current page?" ) ) {
			let page = current_page;
			localforage.getItem( STORAGE_KEY, function ( err, bookmark_storage ) {
				if ( err ) {
					console.log( err );
					alert( "Error storing bookmark" );
					return;
				}
				bookmark_storage[ix].stored_data = page;
				bookmark_storage[ix].date = Date.now();
				localforage.setItem( STORAGE_KEY, bookmark_storage, function ( err ) {
					if ( err ) {
						console.log( err );
						alert( "Error storing bookmark" );
						return;
					}
					refresh_bookmark_list();
				} );
			} );
		}
	} );
	
	$( "#saved_games" ).on( "click", ".saved-game-delete", function ( e ) {
		let ix = $( this ).parents( "li" ).attr( "x-data-saved-game-ix" );
		if ( confirm( "Remove this bookmark?" ) ) {
			localforage.getItem( STORAGE_KEY, function ( err, bookmark_storage ) {
				if ( err ) {
					console.log( err );
					alert( "Error deleting stored bookmark" );
					return;
				}
				console.log( bookmark_storage );
				bookmark_storage.splice( ix, 1 );
				console.log( bookmark_storage );
				localforage.setItem( STORAGE_KEY, bookmark_storage, function ( err ) {
					if ( err ) {
						console.log( err );
						alert( "Error deleting stored bookmark" );
						return;
					}
					refresh_bookmark_list();
				} );
			} );
		}
	} );

	refresh_bookmark_list();

} )( jQuery );
