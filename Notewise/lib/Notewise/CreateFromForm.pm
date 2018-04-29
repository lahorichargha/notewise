package Notewise::CreateFromForm;
use base qw(DBIx::Class);
use strict;
use warnings;

sub create_from_form {
    my $rs = shift;
    my $form = shift;
    my $row = $rs->new({});
    foreach my $column ($rs->result_source->columns){
        $row->$column($form->valid($column))
            if defined $form->valid($column);
    }
    $row->insert();
    return $row;
}

1;
