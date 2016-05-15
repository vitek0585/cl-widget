namespace ThreadTest
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("CategoryConsumer")]
    public partial class CategoryConsumer
    {
        public int Id { get; set; }

        public int CategoryId { get; set; }

        public int ConsumerId { get; set; }

        [Required]
        [StringLength(100)]
        public string CategoryConsumerName { get; set; }

        public virtual Category Category { get; set; }

        public virtual Consumer Consumer { get; set; }
    }
}
