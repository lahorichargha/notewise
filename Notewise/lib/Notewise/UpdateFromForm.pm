package Notewise::UpdateFromForm;
use base qw(DBIx::Class);
use strict;
use warnings;

sub update_from_form {
    my $row = shift;
    my $form = shift;
    foreach my $column ($row->result_source->columns){
        $row->$column($form->valid($column))
            if defined $form->valid($column);
    }
    $row->update();
}

1;
