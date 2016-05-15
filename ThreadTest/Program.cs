using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ThreadTest
{
    class Program
    {
        static void Main(string[] args)
        {
            var factory = new TaskFactory(TaskCreationOptions.LongRunning, TaskContinuationOptions.None);
            var listTask = new List<Task>();

            for (int i = 0; i < 100000; i++)
            {
                var task = factory.StartNew(async () =>
                {
                    var context = new CategoryContext();
                    context.Category.Add(new Category() {CategoryName = $"{i} cat!", RefPhoto = "Foto.img"});
                    await Task.Delay(200);
                        context.SaveChanges();
                });

                listTask.Add(task);
            }
            factory.ContinueWhenAll(listTask.ToArray(), (t) =>
            {
                Console.WriteLine("End");
            });
            Console.ReadKey();
        }
    }
}
