namespace ThreadTest
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("Consumer")]
    public partial class Consumer
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public Consumer()
        {
            CategoryConsumer = new HashSet<CategoryConsumer>();
        }

        public int ConsumerId { get; set; }

        [Required]
        [StringLength(20)]
        public string ConsumerName { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<CategoryConsumer> CategoryConsumer { get; set; }
    }
}
