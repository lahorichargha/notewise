package Notewise::C::Search;

use strict;
use base 'Catalyst::Base';
use CGI;
use POSIX;
use URI::Escape;

=head1 NAME

Notewise::C::Search - Catalyst component

=head1 SYNOPSIS

See L<Notewise>

=head1 DESCRIPTION

Catalyst component.

=head1 METHODS

=over 4

=item default

=cut

sub search : Path {
    my ( $self, $c ) = @_;

    my $start_index = ($c->req->params->{start}||1) - 1; # start is one based
    my $amount = $c->req->params->{count} || 10;
    if($amount < 10 || $amount > 100){
        $amount = 10;
    }

    my $searchstring = $c->req->params->{s};

    my @objects = $self->do_search($c, $searchstring,500);
    warn "found count: ".scalar @objects;

    $c->stash->{start_index} = $start_index + 1;
    if($c->stash->{start_index} > @objects){
        $c->stash->{start_index} = @objects;
    }
    $c->stash->{end_index} = $start_index + $amount;
    if($c->stash->{end_index} > @objects){
        $c->stash->{end_index} = @objects;
    }
    $c->stash->{amount} = $amount;
    $c->stash->{results} = [ @objects[$start_index..$start_index+$amount] ];
    $c->stash->{count} = scalar @objects;
    $c->stash->{current_page} = POSIX::ceil(($start_index+1)/$amount);
    my $last_page = POSIX::ceil(@objects/$amount) || 1;
    $c->stash->{pages} = [1..$last_page];
    $c->stash->{template} = 'Search/search.tt';
}

# quick search
sub s : Global {
    my ( $self, $c ) = @_;
    $c->stash->{template} = 'Search/quicksearch-results.tt';
    $c->forward('quick_search');
}

# kernel autocomplete
sub ac : Global {
    my ( $self, $c ) = @_;
    $c->stash->{template} = 'Search/autocomplete-results.tt';
    $c->forward('quick_search');
}

sub rename : Global {
    my ( $self, $c ) = @_;
    $c->stash->{template} = 'Search/rename-results.tt';
    $c->forward('quick_search');
}

sub quick_search : Private {
    # TODO refactor this
    my ( $self, $c ) = @_;
    my $max_results = 15;

    my $searchstring = $c->req->params->{s};

    my @objects = $self->do_search($c, $searchstring,$max_results+1);
    $c->stash->{more_results} = $objects[$max_results];
    $c->stash->{objects} = \@objects;
}

# actual search code for s and ac
sub do_search {
    # TODO refactor this
    my $self = shift;
    my $c = shift;
    my $searchstring = shift;
    my $max_results = shift;
    my $user_id = $c->user_object->id;

    my $kernel_rs = $c->model('DBIC::Kernel')->search(
                        { 'object_id.user' => $user_id },
                        { join => {object_id => 'user'},
                          prefetch => {object_id => 'user'},
                          page => 0,
                          rows => $max_results,
                        }
                    );

    my @objects = $kernel_rs->search( { 'me.name' => { 'like', $searchstring."%" } } );

    my $fulltext_query;
    if(@objects < $max_results) {
        # if we didn't get enough, get some more
        my $last_space = rindex $searchstring, ' ';
        if($last_space == -1){
            $fulltext_query = "+$searchstring*";
        } else {
            $fulltext_query = '+"'.substr($searchstring,0,$last_space).'" +'.substr($searchstring,$last_space+1).'*';
        }
        #push @objects, $kernel_rs->search( { 'me.name' => { 'like', '% '.$searchstring."%" } } );
        push @objects, $kernel_rs->search_literal("MATCH(me.name) AGAINST (? IN BOOLEAN MODE) AND me.name LIKE ? AND me.name NOT LIKE ?",$fulltext_query, "%".$searchstring."%", "$searchstring%");
    }

    if(@objects < $max_results){
        # if we didn't get enough, get some more
        my $note_rs = $c->model('DBIC::Note')->search(
                        { 'object_id.user' => $user_id },
                        { join => {object_id => ['user','kernel']},
                          prefetch => {object_id => ['user','kernel']},
                          page => 0,
                          rows => $max_results,
                        }
                    );
        push @objects, $note_rs->search_literal("MATCH(me.content) AGAINST (? IN BOOLEAN MODE) AND me.content LIKE ?",$fulltext_query, "%".$searchstring."%");
    }

    # only show up to max_results and don't show duplicates
    my %objects_seen;
    my @objects_to_return;
    foreach my $object (@objects){
        last if(@objects_to_return >= $max_results);
        if(!$objects_seen{$object->id}){
            $objects_seen{$object->id} = $object;
            push @objects_to_return, $object;
        }
    }

    return @objects_to_return;
}

sub find_or_create : Local {
    my ( $self, $c, $searchstring ) = @_;

    $searchstring = uri_unescape($searchstring);

    my @objects = ($self->do_search($c, $searchstring,1));

    if(@objects){
        my $object = $objects[0];
        if(ref $object =~ 'Note$'){
            $object = $object->container_object;
        }
        $c->res->redirect($c->req->base.$object->relative_url);
    } else {
        $c->req->params->{name}=$searchstring;
        $c->forward('/kernel/add');
    }
}

=back


=head1 AUTHOR

Scotty Allen

=head1 LICENSE

This library is free software . You can redistribute it and/or modify
it under the same terms as perl itself.

=cut

1;
